import { searchChunks } from "../services/aiService.js";
import { askLLM } from "../services/llmService.js";
import { routeQuestion } from "../services/localRouterService.js";

import ChatSession from "../models/ChatSession.js";
import ChatMessage from "../models/ChatMessage.js";
import Repository from "../models/Repository.js";

import {
  getFilesByExtension,
  getFullFile,
  getRepositoryFiles, // Add this line
} from "../services/repositoryQueryService.js";

//save assistant message to database

const saveAssistantMessage = async ({
  sessionId,
  answer = "",
  code = "",
  explanation = "",
  sources = [],
}) => {
  await ChatMessage.create({
    sessionId,
    role: "assistant",

    // Store whichever response is available
    content: answer || explanation || "",

    answer,
    code,
    explanation,
    sources,
  });
};

const HISTORY_LIMIT = 10;

//helper function to normalize file names for lookup

const normalizeFileNameForLookup = (name) => {
  if (!name) return "";
  let clean = name.trim().toLowerCase();

  if (
    clean === "pakage.json" ||
    clean === "package.jsn" ||
    clean === "pakage.jsn"
  ) {
    return "package.json";
  }
  if (clean === "reademe.md" || clean === "readme.txt" || clean === "readme") {
    return "readme.md";
  }
  if (clean === "app.js") {
    return "app.jsx";
  }
  return clean;
};

const getRecentHistory = async (sessionId, limit = HISTORY_LIMIT) => {
  const recentDesc = await ChatMessage.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return recentDesc.reverse(); // oldest -> newest
};

const dedupeSources = (sources) => {
  const seen = new Map();

  for (const source of sources) {
    if (!source?.file) continue;

    const key =
      source.source === "chromadb"
        ? `${source.file}::${source.chunk ?? ""}`
        : source.file;

    if (!seen.has(key)) {
      seen.set(key, source);
    } else if (source.source === "mongodb") {
      seen.set(key, source);
    }
  }

  return Array.from(seen.values());
};

const safeSearchChunks = async (
  question,
  repoName,
  repoId = null,
  filePath = null,
) => {
  try {
    const results = await searchChunks(question, repoName, repoId, filePath);
    return {
      documents: results?.documents?.[0] || [],
      metadatas: results?.metadatas?.[0] || [],
      failed: false,
    };
  } catch (error) {
    console.error("ChromaDB search failed, continuing without it:", error);
    return { documents: [], metadatas: [], failed: true };
  }
};

//chat controller function to handle incoming chat requests and route them appropriately

export const chat = async (req, res) => {
  try {
    const { question, repoName, sessionId } = req.body;

    console.log("========================================");
    console.log("CHAT REQUEST");
    console.log("QUESTION:", question);
    console.log("REPO NAME:", repoName);
    console.log("SESSION ID:", sessionId);
    console.log("========================================");

    //validate required parameters

    if (!question || !repoName || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "question, repoName and sessionId are required",
      });
    }

    const session =
      await ChatSession.findById(sessionId).populate("repositoryId");
    if (!session || !session.repositoryId) {
      return res.status(404).json({
        success: false,
        message: "Chat session or repository not found",
      });
    }

    const repoId = session.repositoryId._id.toString();
    const dbRepoName = session.repositoryId.repoName;

    //user message is saved to the database for the given session

    await ChatMessage.create({
      sessionId,
      role: "user",
      content: question,
    });

    //router
    const history = await getRecentHistory(sessionId);

    const route = await routeQuestion(question, history);

    if (route) {
      if (
        route.fileName &&
        ["null", "undefined", "none", "empty"].includes(
          route.fileName.trim().toLowerCase(),
        )
      ) {
        route.fileName = null;
      }
      if (
        route.path &&
        ["null", "undefined", "none", "empty"].includes(
          route.path.trim().toLowerCase(),
        )
      ) {
        route.path = null;
      }
    }

    console.log("========== ROUTER DEBUG ==========");
    console.log("QUESTION:", question);
    console.log("ROUTE:", JSON.stringify(route, null, 2));
    console.log("==================================");

    const queryType = route?.intent;

    console.log("QUERY TYPE:", queryType);

    //file count logic for METADATA queries
    //
    // IMPORTANT:
    //
    // If extensions exist:
    //     count only those extensions.
    //
    // If extensions are empty:
    //     count ALL repository files from MongoDB.
    //
    // NEVER ask ChromaDB/Groq for exact file counts.

    if (queryType === "METADATA") {
      const files = Array.isArray(session.repositoryId.files)
        ? session.repositoryId.files
        : [];

      const isAskingName =
        /repo(sitory)?\s+name|name\s+of\s+(this|the)\s+repo/i.test(question);

      if (isAskingName) {
        const answer = `The name of this repository is "${dbRepoName}".`;
        const sources = [];

        await saveAssistantMessage({ sessionId, answer, sources });
        return res.json({ success: true, answer, sources });
      }

      const extensions = Array.isArray(route.extensions)
        ? route.extensions.filter(Boolean)
        : [];

      if (extensions.length > 0) {
        console.log("METADATA → EXTENSIONS:", extensions);
        const results = [];

        for (const extension of extensions) {
          let matchedFiles = files.filter(
            (file) => file.extension.toLowerCase() === extension.toLowerCase(),
          );

          const targetPath = route.path;
          if (targetPath) {
            const cleanTarget = targetPath
              .replace(/\\/g, "/")
              .replace(/\/$/, "");
            matchedFiles = matchedFiles.filter((file) => {
              const cleanFilePath = file.filePath.replace(/\\/g, "/");
              const pathSegments = cleanFilePath.split("/");
              return (
                cleanFilePath.startsWith(cleanTarget + "/") ||
                cleanFilePath === cleanTarget ||
                pathSegments.includes(cleanTarget)
              );
            });
          }

          results.push({
            extension,
            count: matchedFiles.length,
            files: matchedFiles,
          });
        }

        const folderText = route.path ? ` in the "${route.path}" folder` : "";
        const answer = results
          .map(
            (result) =>
              `There are ${result.count} ${result.extension} files${folderText}.`,
          )
          .join("\n");

        const sources = dedupeSources(
          results.flatMap((result) =>
            result.files.map((file) => ({
              file: file.filePath,
              source: "mongodb",
            })),
          ),
        );

        await saveAssistantMessage({ sessionId, answer, sources });
        return res.json({ success: true, answer, sources });
      }

      const targetPath = route.path;
      if (targetPath) {
        console.log("METADATA → FOLDER PATH:", targetPath);
        const cleanTarget = targetPath.replace(/\\/g, "/").replace(/\/$/, "");
        const matchedFiles = files.filter((file) => {
          const cleanFilePath = file.filePath.replace(/\\/g, "/");
          const pathSegments = cleanFilePath.split("/");
          return (
            cleanFilePath.startsWith(cleanTarget + "/") ||
            cleanFilePath === cleanTarget ||
            pathSegments.includes(cleanTarget)
          );
        });

        const answer = `There are ${matchedFiles.length} files in the "${targetPath}" folder.`;
        const sources = matchedFiles.map((file) => ({
          file: file.filePath,
          source: "mongodb",
        }));

        await saveAssistantMessage({ sessionId, answer, sources });
        return res.json({ success: true, answer, sources });
      }

      console.log("METADATA → TOTAL REPOSITORY FILE COUNT");
      const answer = `There are ${files.length} files in the repository.`;
      const sources = files.map((file) => ({
        file: file.filePath,
        source: "mongodb",
      }));

      await saveAssistantMessage({ sessionId, answer, sources });
      return res.json({ success: true, answer, sources });
    }

    //filecount logic for FILE_LIST queries

    if (queryType === "FILE_LIST") {
      const files = Array.isArray(session.repositoryId.files)
        ? session.repositoryId.files
        : [];

      const extensions = Array.isArray(route.extensions)
        ? route.extensions.filter(Boolean)
        : [];

      const targetPath = route.path;

      console.log("FILE_LIST → extensions:", extensions, "path:", targetPath);

      let matchedFiles = [...files];

      if (targetPath) {
        const cleanTarget = targetPath.replace(/\\/g, "/").replace(/\/$/, "");
        matchedFiles = matchedFiles.filter((file) => {
          const cleanFilePath = file.filePath.replace(/\\/g, "/");
          const pathSegments = cleanFilePath.split("/");
          return (
            cleanFilePath.startsWith(cleanTarget + "/") ||
            cleanFilePath === cleanTarget ||
            pathSegments.includes(cleanTarget)
          );
        });
      }

      if (extensions.length > 0) {
        matchedFiles = matchedFiles.filter((file) =>
          extensions.some(
            (ext) => file.extension.toLowerCase() === ext.toLowerCase(),
          ),
        );
      }

      let answer = "";
      if (matchedFiles.length === 0) {
        const extText =
          extensions.length > 0 ? ` matching ${extensions.join(", ")}` : "";
        const folderText = targetPath ? ` in the "${targetPath}" folder` : "";
        answer = `No files found${extText}${folderText}.`;
      } else {
        const extText = extensions.length > 0 ? ` ${extensions.join("/")}` : "";
        const folderText = targetPath
          ? ` in the "${targetPath}" folder`
          : " in the repository";

        answer =
          `There are ${matchedFiles.length}${extText} files found${folderText}:\n\n` +
          matchedFiles
            .map((file, index) => `${index + 1}. ${file.filePath}`)
            .join("\n");
      }

      const sources = matchedFiles.map((file) => ({
        file: file.filePath,
        source: "mongodb",
      }));

      await saveAssistantMessage({
        sessionId,
        answer,
        sources,
      });

      return res.json({
        success: true,
        answer,
        sources,
      });
    }

    //file retrieval logic for EXACT_FILE queries

    if (queryType === "EXACT_FILE") {
      let fileName = route.fileName ? route.fileName.trim() : null;
      let targetPath = route.path ? route.path.trim() : null;

      if (!fileName && !targetPath) {
        const answer = "Please specify a file name or path.";
        await saveAssistantMessage({ sessionId, answer });
        return res.json({ success: true, answer, sources: [] });
      }

      const normFileName = fileName ? normalizeFileNameForLookup(fileName) : "";
      const normTargetPath = targetPath
        ? targetPath.replace(/\\/g, "/").toLowerCase()
        : "";

      console.log(
        `[EXACT_FILE DEBUG] Requested Name: "${fileName}" (Normalized: "${normFileName}"), Target Path: "${targetPath}"`,
      );

      const files = Array.isArray(session.repositoryId.files)
        ? session.repositoryId.files
        : [];

      let matches = [];
      if (normFileName) {
        matches = files.filter((f) => {
          const fName = f.fileName.toLowerCase();
          const fPath = f.filePath.replace(/\\/g, "/").toLowerCase();
          return (
            fName === normFileName ||
            fPath.endsWith("/" + normFileName) ||
            fPath === normFileName
          );
        });
      } else if (normTargetPath) {
        matches = files.filter((f) => {
          const fPath = f.filePath.replace(/\\/g, "/").toLowerCase();
          return (
            fPath === normTargetPath || fPath.endsWith("/" + normTargetPath)
          );
        });
      }

      if (normFileName && normTargetPath) {
        matches = matches.filter((f) => {
          const fPath = f.filePath.replace(/\\/g, "/").toLowerCase();
          return fPath.includes(normTargetPath);
        });
      }

      console.log("========== EXACT FILE RETRIEVAL LOG ==========");
      console.log("Requested Filename:", fileName || "(none)");
      console.log("Normalized Filename:", normFileName || "(none)");
      console.log("Repository ID:", repoId);
      console.log("Manifest Files Searched:", files.length);
      console.log("Matches Found Count:", matches.length);
      console.log(
        "Matched File Paths:",
        matches.map((m) => m.filePath),
      );
      console.log("Match Found:", matches.length > 0);
      console.log("==============================================");

      if (matches.length > 1) {
        const answer =
          `I found multiple files matching that name:\n` +
          matches.map((f, index) => `${index + 1}. ${f.filePath}`).join("\n") +
          `\n\nPlease clarify which file you want to see.`;

        const sources = matches.map((f) => ({
          file: f.filePath,
          source: "mongodb",
        }));

        await saveAssistantMessage({ sessionId, answer, sources });
        return res.json({ success: true, answer, sources });
      }

      if (matches.length === 0) {
        const missingName = fileName || targetPath;
        const answer = `No file named \`${missingName}\` was found in the repository.`;

        await saveAssistantMessage({ sessionId, answer });
        return res.json({ success: true, answer, sources: [] });
      }

      const file = matches[0];
      const isShowQuery =
        /show|open|display|content|inside|give\s+me|read|view/i.test(question);
      const isExistenceQuery = /exists|is\s+there|do\s+we\s+have/i.test(
        question,
      );

      let answer = "";
      let code = null;

      if (isShowQuery) {
        answer = `Opened ${file.fileName} in the editor.`;
        code = file.content;
      } else if (isExistenceQuery) {
        answer = `Yes. There is a file named \`${file.fileName}\` at: \n\n${file.filePath}`;
      } else {
        answer = `The file \`${file.fileName}\` is located at: \n\n${file.filePath}`;
      }

      const sources = [{ file: file.filePath, source: "mongodb" }];

      await saveAssistantMessage({ sessionId, answer, code, sources });

      return res.json({
        success: true,
        answer,
        code,
        file: isShowQuery
          ? {
              fileName: file.fileName,
              filePath: file.filePath,
              extension: file.extension,
            }
          : null,
        sources,
      });
    }
    //code explanation logic for CODE_EXPLANATION queries

    if (queryType === "CODE_EXPLANATION") {
      const fileName = route.fileName;
      let targetFile = null;
      let mongoSource = null;

      const files = Array.isArray(session.repositoryId.files)
        ? session.repositoryId.files
        : [];

      if (fileName) {
        targetFile = files.find(
          (f) => f.fileName.toLowerCase() === fileName.toLowerCase(),
        );

        if (targetFile) {
          mongoSource = {
            file: targetFile.filePath,
            source: "mongodb",
          };
        }
      }

      const { documents, metadatas } = await safeSearchChunks(
        question,
        dbRepoName,
        repoId,
        targetFile ? targetFile.filePath : null,
      );

      const chromaContext = documents
        .map(
          (doc, idx) =>
            `File: ${metadatas[idx]?.filePath || "Unknown"}\nCode:\n${doc}`,
        )
        .join("\n\n");

      let repositoryContext = "";
      if (targetFile) {
        repositoryContext += `
==================================================
TARGET FILE CONTENT (mongodb)
==================================================
File Path: ${targetFile.filePath}
Content:
${targetFile.content}
==================================================
`;
      }

      if (chromaContext) {
        repositoryContext += `
==================================================
SUPPORTING CODE CHUNKS (chromadb)
==================================================
${chromaContext}
==================================================
`;
      }

      console.log("Sending CODE_EXPLANATION request to Groq...");
      const explanation = await askLLM(question, repositoryContext, history);

      const sources = [];
      if (mongoSource) sources.push(mongoSource);
      metadatas.forEach((m) => {
        if (m?.filePath) {
          sources.push({
            file: m.filePath,
            chunk: m.chunkIndex,
            source: "chromadb",
          });
        }
      });

      const deduped = dedupeSources(sources);

      await saveAssistantMessage({
        sessionId,
        code: targetFile ? targetFile.content : "",
        explanation,
        sources: deduped,
      });

      return res.json({
        success: true,
        code: targetFile ? targetFile.content : null,
        file: targetFile
          ? {
              fileName: targetFile.fileName,
              filePath: targetFile.filePath,
              extension: targetFile.extension,
            }
          : null,
        explanation,
        sources: deduped,
      });
    }

    //repository overview logic for REPO_OVERVIEW queries

    if (queryType === "REPO_OVERVIEW") {
      const files = Array.isArray(session.repositoryId.files)
        ? session.repositoryId.files
        : [];

      const readmeFile = files.find(
        (f) => f.fileName.toLowerCase() === "readme.md",
      );
      const packageJson = files.find(
        (f) => f.fileName.toLowerCase() === "package.json",
      );
      const filePathsList = files
        .slice(0, 50)
        .map((f) => f.filePath)
        .join("\n");

      let context = `REPOSITORY NAME: ${dbRepoName}\n\n`;
      context += `DIRECTORY STRUCTURE (Capped to first 50 files):\n${filePathsList}\n\n`;

      const sources = [];
      if (readmeFile) {
        context += `README.md CONTENT:\n${readmeFile.content.slice(0, 4000)}\n\n`;
        sources.push({ file: readmeFile.filePath, source: "mongodb" });
      }
      if (packageJson) {
        context += `package.json CONTENT:\n${packageJson.content.slice(0, 2000)}\n\n`;
        sources.push({ file: packageJson.filePath, source: "mongodb" });
      }

      console.log("Sending REPO_OVERVIEW request to Groq...");
      const answer = await askLLM(question, context, history);

      await saveAssistantMessage({
        sessionId,
        answer,
        sources,
      });

      return res.json({
        success: true,
        answer,
        sources,
      });
    }

    //semantic code question logic for SEMANTIC_CODE_QUESTION queries

    console.log("SEMANTIC CODE QUESTION / FALLBACK");

    const files = Array.isArray(session.repositoryId.files)
      ? session.repositoryId.files
      : [];

    const fileName = route.fileName;
    let targetFile = null;
    let mongoSource = null;

    if (fileName) {
      targetFile = files.find(
        (f) => f.fileName.toLowerCase() === fileName.toLowerCase(),
      );
      if (targetFile) {
        mongoSource = {
          file: targetFile.filePath,
          source: "mongodb",
        };
      }
    }

    const { documents, metadatas } = await safeSearchChunks(
      question,
      dbRepoName,
      repoId,
      targetFile ? targetFile.filePath : null,
    );

    const fileListString = files
      .slice(0, 50)
      .map((f) => f.filePath)
      .join("\n");

    let context = "";
    if (targetFile) {
      context += `
==================================================
TARGET FILE CONTENT (mongodb)
==================================================
File Path: ${targetFile.filePath}
Content:
${targetFile.content}
==================================================
`;
    }

    context += `
REPOSITORY FILES INVENTORY:
${fileListString || "No files found"}

SEMANTIC CODE CHUNKS (from ChromaDB):
${documents
  .map((doc, idx) => {
    const meta = metadatas[idx];
    return `File: ${meta?.filePath || "Unknown"}\nCode:\n${doc}`;
  })
  .join("\n\n")}
`;

    console.log("Sending semantic question to Groq...");
    const answer = await askLLM(question, context, history);

    const sources = [];
    if (mongoSource) {
      sources.push(mongoSource);
    }
    metadatas.forEach((m) => {
      if (m?.filePath) {
        sources.push({
          file: m.filePath,
          chunk: m.chunkIndex,
          source: "chromadb",
        });
      }
    });

    const deduped = dedupeSources(sources);

    await saveAssistantMessage({
      sessionId,
      answer,
      sources: deduped,
    });

    return res.json({
      success: true,
      answer,
      sources: deduped,
    });
  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all chat sessions for the user, sorted by last updated

export const getAllSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find()
      .populate("repositoryId", "repoName")
      .sort({
        updatedAt: -1,
      });

    return res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Failed to load all sessions:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all chat sessions for a specific repository, sorted by last updated

export const getSessions = async (req, res) => {
  try {
    const { repositoryId } = req.params;

    const sessions = await ChatSession.find({
      repositoryId,
    })
      .populate("repositoryId", "repoName")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all messages for a specific chat session, sorted by creation time

export const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findById(sessionId).populate(
      "repositoryId",
      "repoName",
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const messages = await ChatMessage.find({
      sessionId,
    }).sort({
      createdAt: 1,
    });

    return res.json({
      success: true,
      session,
      messages,
    });
  } catch (error) {
    console.error("Get session messages error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create a new chat session for a specific repository

export const createSession = async (req, res) => {
  try {
    const { repositoryId, title } = req.body;

    if (!repositoryId) {
      return res.status(400).json({
        success: false,
        message: "repositoryId is required",
      });
    }

    const session = await ChatSession.create({
      repositoryId,

      title: title || "New Chat",
    });

    const populatedSession = await ChatSession.findById(session._id).populate(
      "repositoryId",
      "repoName",
    );

    return res.json({
      success: true,
      session: populatedSession,
    });
  } catch (error) {
    console.error("Create session error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//delete a chat session and all its messages

export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
      });
    }

    // Delete messages first
    await ChatMessage.deleteMany({
      sessionId,
    });

    // Delete session
    const deletedSession = await ChatSession.findByIdAndDelete(sessionId);

    if (!deletedSession) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    return res.json({
      success: true,

      message: "Chat session deleted successfully",

      sessionId,
    });
  } catch (error) {
    console.error("Delete session error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
