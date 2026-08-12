import { searchChunks } from "../services/aiService.js";
import { askLLM } from "../services/llmService.js";
import { routeQuestion } from "../services/localRouterService.js";
import ChatSession from "../models/ChatSession.js";
import ChatMessage from "../models/ChatMessage.js";
import {
    getFilesByExtension,
    getFullFile,
} from "../services/repositoryQueryService.js";
import Repository from "../models/Repository.js";

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
        content: answer,
        answer,
        code,
        explanation,
        sources,
    });
};
export const chat = async (req, res) => {
    try {
        const { question, repoName, sessionId } = req.body;

        console.log("CHAT BODY:", req.body);
        console.log("QUESTION:", question);
        console.log("REPO NAME:", repoName);
        console.log("SESSION ID:", sessionId);

        // VALIDATION

        if (!question || !repoName || !sessionId) {
            return res.status(400).json({
                success: false,
                message: "question, repoName and sessionId are required",
            });
        }
        await ChatMessage.create({
            sessionId,
            role: "user",
            content: question,
        });

        // 1. LOCAL OLLAMA ROUTER

        const route = await routeQuestion(question);

        console.log("LOCAL LLM ROUTE:", route);

        const queryType = route.intent;

        console.log("QUERY TYPE:", queryType);

        // 2. FILE COUNT → MONGODB

        if (queryType === "FILE_COUNT") {
            const extensions = Array.isArray(route.extensions)
                ? route.extensions
                : [];

            if (extensions.length === 0) {
                return res.json({
                    success: true,
                    answer: "I couldn't determine the file extension.",
                    sources: [],
                });
            }

            const results = [];

            for (const extension of extensions) {
                const files = await getFilesByExtension(repoName, extension);

                results.push({
                    extension,
                    count: files.length,
                    files,
                });
            }

            const answer = results
                .map((result) => `${result.count} ${result.extension} files`)
                .join(" and ");

            const sources = results.flatMap((result) =>
                result.files.map((file) => ({
                    file: file.filePath,
                    source: "mongodb",
                })),
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

        // 3. FILE LIST → MONGODB

        if (queryType === "FILE_LIST") {
            const extensions = Array.isArray(route.extensions)
                ? route.extensions
                : [];

            if (extensions.length === 0) {
                return res.json({
                    success: true,
                    answer: "I couldn't determine the file extensions.",
                    sources: [],
                });
            }

            const results = [];

            for (const extension of extensions) {
                const files = await getFilesByExtension(repoName, extension);

                results.push({
                    extension,
                    files,
                });
            }

            const answer = results
                .map((result) => {
                    if (result.files.length === 0) {
                        return `No ${result.extension} files found.`;
                    }

                    return (
                        `${result.extension} files:\n` +
                        result.files
                            .map((file, index) => `${index + 1}. ${file.fileName}`)
                            .join("\n")
                    );
                })
                .join("\n\n");

            const sources = results.flatMap((result) =>
                result.files.map((file) => ({
                    file: file.filePath,
                    source: "mongodb",
                })),
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

        // 4. FULL FILE → MONGODB

        if (queryType === "FULL_FILE") {
            const fileName = route.fileName;

            if (!fileName) {
                return res.json({
                    success: true,
                    answer: "Please specify the file name.",
                    sources: [],
                });
            }

            const file = await getFullFile(repoName, fileName);

            if (!file) {
                const answer = `I couldn't find ${fileName} in the repository.`;
                await saveAssistantMessage({
                    sessionId,
                    answer,
                    sources: [],
                });
                return res.json({
                    success: true,
                    answer,
                    sources: [],
                });
            }

            const answer = `Opened ${file.fileName} in the editor.`;
            const code = file.content;
            const sources = [
                {
                    file: file.filePath,
                    source: "mongodb",
                },
            ];

            // Save assistant message to Database
            await saveAssistantMessage({
                sessionId,
                answer,
                code,
                sources,
            });

            return res.json({
                success: true,
                answer,
                code, // Set to code so editor loads it
                file: {
                    fileName: file.fileName,
                    filePath: file.filePath,
                    extension: file.extension,
                },
                sources,
            });
        }

        // COMPLEX
        // MONGODB + CHROMADB + GROQ

        if (queryType === "COMPLEX") {
            console.log("COMPLEX QUERY → MongoDB + ChromaDB");

            const fileName = route.fileName;

            let file = null;

            let mongoSource = null;

            // MONGODB
            // GET EXACT FILE

            if (fileName) {
                file = await getFullFile(repoName, fileName);

                if (file) {
                    console.log(`MongoDB: Found ${fileName}`);

                    mongoSource = {
                        file: file.filePath,

                        source: "mongodb",
                    };
                } else {
                    console.log(`MongoDB: ${fileName} not found`);
                }
            }

            // CHROMADB
            // SEMANTIC SEARCH

            console.log("Searching ChromaDB...");

            const results = await searchChunks(
                question,
                repoName,
                file ? file.filePath : null,
            );

            const documents = results.documents?.[0] || [];

            const metadatas = results.metadatas?.[0] || [];

            const chromaContext = documents
                .map((document, index) => {
                    const metadata = metadatas[index];

                    return `
                   File: ${metadata?.filePath || "Unknown"}

                  Relevant Code:

              ${document}`;
                })
                .join("\n\n");

            //  CONTEXT FOR GROQ

            const context = `

             You are explaining code from a software repository.

                The user asked:

             ${question}

            Target file:

            ${fileName || "Not specified"}


                  Relevant code retrieved from ChromaDB:

              ${chromaContext}


                  IMPORTANT INSTRUCTIONS:

- Explain the code clearly and accurately.
- Use the retrieved code as your source of truth.
- Do NOT reproduce the complete file.
- Do NOT output the entire source code.
- Do NOT wrap the complete file in your response.
- Explain the important components, functions, hooks,
  logic, data flow, and relationships relevant to the question.
- Use proper Markdown formatting.
- Use headings and bullet points where appropriate.
- If useful, include SMALL code snippets only.
- Do not invent code that is not present in the retrieved context.

`;

            // GROQ
            // GENERATE EXPLANATION ONLY

            console.log("Sending explanation request to Groq...");

            // Retrieve session history
            const history = await ChatMessage.find({ sessionId })
                .sort({ createdAt: 1 })
                .limit(10); // Grab last 10 messages for context

            console.log("Sending explanation request to Groq with history...");

            const explanation = await askLLM(question, context, history);

            console.log("GROQ EXPLANATION RECEIVED:");
            console.log(explanation);

            //  SOURCES

            const sources = [];

            if (mongoSource) {
                sources.push(mongoSource);
            }

            metadatas.forEach((metadata) => {
                sources.push({
                    file: metadata.filePath,

                    chunk: metadata.chunkIndex,

                    source: "chromadb",
                });
            });

            //  RESPONSE

            await saveAssistantMessage({
                sessionId,

                code: file ? file.content : "",

                explanation,

                sources,
            });
            return res.json({
                success: true,

                // Exact source code
                // Frontend will show this
                // inside a code editor.

                code: file ? file.content : null,

                // File information

                file: file
                    ? {
                        fileName: file.fileName,

                        filePath: file.filePath,

                        extension: file.extension,
                    }
                    : null,

                // LLM explanation

                explanation,

                sources,
            });
        }

        // NORMAL CODE QUESTION
        // CHROMADB

        console.log("Searching ChromaDB...");

        const results = await searchChunks(question, repoName);

        const documents = results.documents?.[0] || [];

        const metadatas = results.metadatas?.[0] || [];

        const context = documents
            .map((document, index) => {
                const metadata = metadatas[index];

                return `
File: ${metadata?.filePath || "Unknown"}

Code:

${document}
`;
            })
            .join("\n\n");

        // 7. ASK GROQ

        // Retrieve session history
        const history = await ChatMessage.find({ sessionId })
            .sort({ createdAt: 1 })
            .limit(10);

        const answer = await askLLM(question, context, history);

        // 8. SOURCES

        const sources = metadatas.map((metadata) => ({
            file: metadata.filePath,

            chunk: metadata.chunkIndex,

            source: "chromadb",
        }));

        // 9. NORMAL RESPONSE

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
    } catch (error) {
        console.error("Chat error:", error);

        return res.status(500).json({
            success: false,

            message: error.message,
        });
    }
};

export const getAllSessions = async (req, res) => {
    try {
        const sessions = await ChatSession.find()
            .populate("repositoryId", "repoName")
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            sessions,
        });
    } catch (error) {
        console.error("Failed to load all sessions:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// New controllers for history endpoints
export const getSessions = async (req, res) => {
    try {
        const { repositoryId } = req.params;

        const sessions = await ChatSession.find({ repositoryId })
            .populate("repositoryId", "repoName")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            sessions,
        });
    } catch (error) {
        console.error("Get sessions error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

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

        const messages = await ChatMessage.find({ sessionId }).sort({
            createdAt: 1,
        });

        res.json({
            success: true,
            session,
            messages,
        });
    } catch (error) {
        console.error("Get session messages error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

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

        res.json({
            success: true,
            session: populatedSession,
        });
    } catch (error) {
        console.error("Create session error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required",
            });
        }

        // Delete all messages belonging to this session
        await ChatMessage.deleteMany({
            sessionId,
        });

        // Delete the session itself
        const deletedSession = await ChatSession.findByIdAndDelete(sessionId);

        if (!deletedSession) {
            return res.status(404).json({
                success: false,
                message: "Chat session not found",
            });
        }

        res.json({
            success: true,
            message: "Chat session deleted successfully",
            sessionId,
        });
    } catch (error) {
        console.error("Delete session error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
