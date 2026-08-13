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

// ============================================================
// SAVE ASSISTANT MESSAGE
// ============================================================

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

// ============================================================
// CHAT
// ============================================================

export const chat = async (req, res) => {
  try {
    const {
      question,
      repoName,
      sessionId,
    } = req.body;

    console.log("========================================");
    console.log("CHAT REQUEST");
    console.log("QUESTION:", question);
    console.log("REPO NAME:", repoName);
    console.log("SESSION ID:", sessionId);
    console.log("========================================");

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!question || !repoName || !sessionId) {
      return res.status(400).json({
        success: false,
        message:
          "question, repoName and sessionId are required",
      });
    }

    // ========================================================
    // SAVE USER MESSAGE
    // ========================================================

    await ChatMessage.create({
      sessionId,
      role: "user",
      content: question,
    });

    // ========================================================
    // ROUTER
    // ========================================================
    const history = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(10);

    const route = await routeQuestion(question,history);

    console.log("========== ROUTER DEBUG ==========");
    console.log(
      "QUESTION:",
      question
    );
    console.log(
      "ROUTE:",
      JSON.stringify(route, null, 2)
    );
    console.log(
      "==================================");

    const queryType = route?.intent;

    console.log(
      "QUERY TYPE:",
      queryType
    );

    // ========================================================
    // 1. FILE COUNT
    // ========================================================
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
    // ========================================================

    if (queryType === "FILE_COUNT") {
      const extensions = Array.isArray(route.extensions)
        ? route.extensions.filter(Boolean)
        : [];

      // ------------------------------------------------------
      // TOTAL REPOSITORY FILE COUNT
      // ------------------------------------------------------

      if (extensions.length === 0) {
        console.log(
          "FILE_COUNT → TOTAL REPOSITORY FILE COUNT"
        );

        const repository =
          await Repository.findOne({
            repoName,
          });

        if (!repository) {
          const answer =
            `Repository "${repoName}" was not found.`;

          await saveAssistantMessage({
            sessionId,
            answer,
          });

          return res.json({
            success: true,
            answer,
            sources: [],
          });
        }

        let files =
          Array.isArray(repository.files)
            ? repository.files
            : [];

        // Check if the user specified a folder/path
        const targetPath = route.path;
        if (targetPath) {
          const cleanTarget = targetPath.replace(/\\/g, "/").replace(/\/$/, "");
          files = files.filter((file) => {
            const cleanFilePath = file.filePath.replace(/\\/g, "/");
            const pathSegments = cleanFilePath.split("/");
            return cleanFilePath.startsWith(cleanTarget + "/") || 
                   cleanFilePath === cleanTarget ||
                   pathSegments.includes(cleanTarget);
          });
        }

        const answer = targetPath
          ? `There are ${files.length} files in the "${targetPath}" folder.`
          : `There are ${files.length} files in the repository.`;

        const sources =
          files.map((file) => ({
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

      // ------------------------------------------------------
      // EXTENSION FILE COUNT
      // ------------------------------------------------------

      console.log(
        "FILE_COUNT → EXTENSIONS:",
        extensions
      );

      const results = [];

      for (const extension of extensions) {
        let files =
          await getFilesByExtension(
            repoName,
            extension
          );

        // Filter by path if specified
        const targetPath = route.path;
        if (targetPath) {
          const cleanTarget = targetPath.replace(/\\/g, "/").replace(/\/$/, "");
          files = files.filter((file) => {
            const cleanFilePath = file.filePath.replace(/\\/g, "/");
            const pathSegments = cleanFilePath.split("/");
            return cleanFilePath.startsWith(cleanTarget + "/") || 
                   cleanFilePath === cleanTarget ||
                   pathSegments.includes(cleanTarget);
          });
        }

        results.push({
          extension,
          count: files.length,
          files,
        });
      }

      const answer = results
        .map((result) => {
          const folderText = route.path ? ` in the "${route.path}" folder` : "";
          return `There are ${result.count} ${result.extension} files${folderText}.`;
        })
        .join("\n");

      const sources =
        results.flatMap(
          (result) =>
            result.files.map(
              (file) => ({
                file: file.filePath,
                source: "mongodb",
              })
            )
        );

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

    // ========================================================
    // 2. FILE LIST
    // ========================================================

    if (queryType === "FILE_LIST") {
      const extensions = Array.isArray(
        route.extensions
      )
        ? route.extensions.filter(Boolean)
        : [];

      if (extensions.length === 0) {
        const answer =
          "I couldn't determine the file extension.";

        await saveAssistantMessage({
          sessionId,
          answer,
        });

        return res.json({
          success: true,
          answer,
          sources: [],
        });
      }

      console.log(
        "FILE_LIST → EXTENSIONS:",
        extensions
      );

      const results = [];

      for (const extension of extensions) {
        let files =
          await getFilesByExtension(
            repoName,
            extension
          );

        // Filter by path if specified
        const targetPath = route.path;
        if (targetPath) {
          const cleanTarget = targetPath.replace(/\\/g, "/").replace(/\/$/, "");
          files = files.filter((file) => {
            const cleanFilePath = file.filePath.replace(/\\/g, "/");
            const pathSegments = cleanFilePath.split("/");
            return cleanFilePath.startsWith(cleanTarget + "/") || 
                   cleanFilePath === cleanTarget ||
                   pathSegments.includes(cleanTarget);
          });
        }

        results.push({
          extension,
          files,
        });
      }

      const answer = results
        .map((result) => {
          if (result.files.length === 0) {
            const folderText = route.path ? ` in the "${route.path}" folder` : "";
            return `No ${result.extension} files found${folderText}.`;
          }

          const folderText = route.path ? ` in the "${route.path}" folder` : "";
          return (
            `${result.extension} files${folderText}:\n` +
            result.files
              .map(
                (file, index) =>
                  `${index + 1}. ${file.fileName}`
              )
              .join("\n")
          );
        })
        .join("\n\n");

      const sources =
        results.flatMap(
          (result) =>
            result.files.map(
              (file) => ({
                file: file.filePath,
                source: "mongodb",
              })
            )
        );

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

    // ========================================================
    // 3. FULL FILE
    // ========================================================

    if (queryType === "FULL_FILE") {
      const fileName = route.fileName;

      if (!fileName) {
        const answer =
          "Please specify the file name.";

        await saveAssistantMessage({
          sessionId,
          answer,
        });

        return res.json({
          success: true,
          answer,
          sources: [],
        });
      }

      console.log(
        "FULL_FILE →",
        fileName
      );

      const file =
        await getFullFile(
          repoName,
          fileName
        );

      if (!file) {
        const answer =
          `I couldn't find ${fileName} in the repository.`;

        await saveAssistantMessage({
          sessionId,
          answer,
        });

        return res.json({
          success: true,
          answer,
          sources: [],
        });
      }

      const answer =
        `Opened ${file.fileName} in the editor.`;

      const code = file.content;

      const sources = [
        {
          file: file.filePath,
          source: "mongodb",
        },
      ];

      await saveAssistantMessage({
        sessionId,
        answer,
        code,
        sources,
      });

      return res.json({
        success: true,

        answer,

        code,

        file: {
          fileName:
            file.fileName,

          filePath:
            file.filePath,

          extension:
            file.extension,
        },

        sources,
      });
    }

    // ========================================================
    // 4. COMPLEX
    // MongoDB + ChromaDB + Groq
    // ========================================================

    if (queryType === "COMPLEX") {
      console.log(
        "========================================"
      );
      console.log(
        "COMPLEX QUERY → MongoDB + ChromaDB + Groq"
      );
      console.log(
        "========================================"
      );

      const fileName =
        route.fileName;

      let file = null;

      let mongoSource = null;

      // ------------------------------------------------------
      // 4A. GET EXACT FILE FROM MONGODB
      // ------------------------------------------------------

      if (fileName) {
        console.log(
          "MongoDB lookup:",
          fileName
        );

        file =
          await getFullFile(
            repoName,
            fileName
          );

        if (file) {
          console.log(
            `MongoDB: Found ${fileName}`
          );

          mongoSource = {
            file:
              file.filePath,

            source:
              "mongodb",
          };
        } else {
          console.log(
            `MongoDB: ${fileName} NOT FOUND`
          );
        }
      }

      // ------------------------------------------------------
      // 4B. CHROMADB SEMANTIC SEARCH
      // ------------------------------------------------------

      console.log(
        "Searching ChromaDB..."
      );

      const results =
        await searchChunks(
          question,
          repoName,
          file
            ? file.filePath
            : null
        );

      const documents =
        results?.documents?.[0] || [];

      const metadatas =
        results?.metadatas?.[0] || [];

      console.log(
        "ChromaDB documents:",
        documents.length
      );

      console.log(
        "ChromaDB metadata:",
        metadatas.length
      );

      // ------------------------------------------------------
      // 4C. BUILD CHROMADB CONTEXT
      // ------------------------------------------------------

      const chromaContext =
        documents
          .map(
            (document, index) => {
              const metadata =
                metadatas[index];

              return `
File:
${metadata?.filePath || "Unknown"}

Relevant Code:
${document}
`;
            }
          )
          .join("\n\n");

      // ------------------------------------------------------
      // 4D. BUILD REPOSITORY CONTEXT
      //
      // IMPORTANT:
      //
      // MongoDB exact file is PRIMARY.
      // ChromaDB is SUPPORTING context.
      // ------------------------------------------------------

      let repositoryContext = "";

      if (file) {
        repositoryContext += `
==================================================
EXACT FILE FROM MONGODB
==================================================

File Name:
${file.fileName}

File Path:
${file.filePath}

Extension:
${file.extension}

COMPLETE FILE CONTENT:

${file.content}

==================================================
END EXACT FILE
==================================================
`;
      }

      if (chromaContext) {
        repositoryContext += `
==================================================
SEMANTICALLY RELEVANT CODE FROM CHROMADB
==================================================

${chromaContext}

==================================================
END CHROMADB CONTEXT
==================================================
`;
      }

      // ------------------------------------------------------
      // 4E. SESSION HISTORY
      // ------------------------------------------------------



      // ------------------------------------------------------
      // 4F. GROQ
      // ------------------------------------------------------

      console.log(
        "Sending explanation request to Groq..."
      );

      const explanation =
        await askLLM(
          question,
          repositoryContext,
          history
        );

      console.log(
        "GROQ EXPLANATION RECEIVED:"
      );

      console.log(
        explanation
      );

      // ------------------------------------------------------
      // 4G. SOURCES
      // ------------------------------------------------------

      const sources = [];

      if (mongoSource) {
        sources.push(
          mongoSource
        );
      }

      metadatas.forEach(
        (metadata) => {
          if (
            metadata?.filePath
          ) {
            sources.push({
              file:
                metadata.filePath,

              chunk:
                metadata.chunkIndex,

              source:
                "chromadb",
            });
          }
        }
      );

      // ------------------------------------------------------
      // 4H. SAVE ASSISTANT MESSAGE
      // ------------------------------------------------------

      await saveAssistantMessage({
        sessionId,

        code:
          file
            ? file.content
            : "",

        explanation,

        sources,
      });

      // ------------------------------------------------------
      // 4I. RESPONSE
      // ------------------------------------------------------

      return res.json({
        success: true,

        code:
          file
            ? file.content
            : null,

        file:
          file
            ? {
                fileName:
                  file.fileName,

                filePath:
                  file.filePath,

                extension:
                  file.extension,
              }
            : null,

        explanation,

        sources,
      });
    }

    // ========================================================
    // 5. NORMAL CODE QUESTION
    // ChromaDB + Groq
    // ========================================================

    console.log(
      "NORMAL CODE QUESTION"
    );

    console.log(
      "Searching ChromaDB..."
    );

    const results =
      await searchChunks(
        question,
        repoName
      );

    const documents =
      results?.documents?.[0] || [];

    const metadatas =
      results?.metadatas?.[0] || [];

    console.log(
      "ChromaDB documents:",
      documents.length
    );

    // ------------------------------------------------------
    // BUILD HYBRID CONTEXT (MongoDB File List + ChromaDB Code Chunks)
    // ------------------------------------------------------
    const repoFiles = await getRepositoryFiles(repoName);
    const fileListString = repoFiles.map((f) => f.filePath).join("\n");

    const context = `
REPOSITORY FILES INVENTORY (from MongoDB):
${fileListString || "No files found"}

SEMANTIC CODE CHUNKS (from ChromaDB):
${documents.map((document, index) => {
  const metadata = metadatas[index];
  return `
File: ${metadata?.filePath || "Unknown"}
Code:
${document}
`;
}).join("\n\n")}
`;

    // ------------------------------------------------------
    // HISTORY
    // ------------------------------------------------------

    // ------------------------------------------------------
    // GROQ
    // ------------------------------------------------------

    console.log(
      "Sending normal question to Groq..."
    );

    const answer =
      await askLLM(
        question,
        context,
        history
      );

    //     // ------------------------------------------------------
    // SOURCES (Hybrid: MongoDB + ChromaDB)
    // ------------------------------------------------------
    const sources = [];

    // 1. Add MongoDB files
    repoFiles.forEach((file) => {
      sources.push({
        file: file.filePath,
        source: "mongodb",
      });
    });

    // 2. Add ChromaDB search chunks
    metadatas.forEach((metadata) => {
      if (metadata?.filePath) {
        sources.push({
          file: metadata.filePath,
          chunk: metadata.chunkIndex,
          source: "chromadb",
        });
      }
    });
    // ------------------------------------------------------
    // SAVE
    // ------------------------------------------------------

    await saveAssistantMessage({
      sessionId,
      answer,
      sources,
    });

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------

    return res.json({
      success: true,
      answer,
      sources,
    });

  } catch (error) {
    console.error(
      "Chat error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ============================================================
// GET ALL SESSIONS
// ============================================================

export const getAllSessions =
  async (req, res) => {
    try {
      const sessions =
        await ChatSession.find()
          .populate(
            "repositoryId",
            "repoName"
          )
          .sort({
            updatedAt: -1,
          });

      return res.json({
        success: true,
        sessions,
      });

    } catch (error) {
      console.error(
        "Failed to load all sessions:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ============================================================
// GET SESSIONS FOR REPOSITORY
// ============================================================

export const getSessions =
  async (req, res) => {
    try {
      const {
        repositoryId,
      } = req.params;

      const sessions =
        await ChatSession.find({
          repositoryId,
        })
          .populate(
            "repositoryId",
            "repoName"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        sessions,
      });

    } catch (error) {
      console.error(
        "Get sessions error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ============================================================
// GET SESSION MESSAGES
// ============================================================

export const getSessionMessages =
  async (req, res) => {
    try {
      const {
        sessionId,
      } = req.params;

      const session =
        await ChatSession.findById(
          sessionId
        ).populate(
          "repositoryId",
          "repoName"
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          message:
            "Session not found",
        });
      }

      const messages =
        await ChatMessage.find({
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
      console.error(
        "Get session messages error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ============================================================
// CREATE SESSION
// ============================================================

export const createSession =
  async (req, res) => {
    try {
      const {
        repositoryId,
        title,
      } = req.body;

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          message:
            "repositoryId is required",
        });
      }

      const session =
        await ChatSession.create({
          repositoryId,

          title:
            title || "New Chat",
        });

      const populatedSession =
        await ChatSession.findById(
          session._id
        ).populate(
          "repositoryId",
          "repoName"
        );

      return res.json({
        success: true,
        session:
          populatedSession,
      });

    } catch (error) {
      console.error(
        "Create session error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ============================================================
// DELETE SESSION
// ============================================================

export const deleteSession =
  async (req, res) => {
    try {
      const {
        sessionId,
      } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message:
            "sessionId is required",
        });
      }

      // Delete messages first
      await ChatMessage.deleteMany({
        sessionId,
      });

      // Delete session
      const deletedSession =
        await ChatSession.findByIdAndDelete(
          sessionId
        );

      if (!deletedSession) {
        return res.status(404).json({
          success: false,
          message:
            "Chat session not found",
        });
      }

      return res.json({
        success: true,

        message:
          "Chat session deleted successfully",

        sessionId,
      });

    } catch (error) {
      console.error(
        "Delete session error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };