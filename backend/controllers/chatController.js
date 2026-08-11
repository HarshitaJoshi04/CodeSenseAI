import { searchChunks } from "../services/aiService.js";
import { askLLM } from "../services/llmService.js";
import { routeQuestion } from "../services/localRouterService.js";

import {
    getFilesByExtension,
    getFullFile,
} from "../services/repositoryQueryService.js";


export const chat = async (req, res) => {

    try {

        const { question, repoName } = req.body;


        // ========================================
        // VALIDATION
        // ========================================

        if (!question || !repoName) {

            return res.status(400).json({
                success: false,
                message: "question and repoName are required",
            });

        }


        // ========================================
        // 1. LOCAL OLLAMA ROUTER
        // ========================================

        const route = await routeQuestion(question);

        console.log(
            "LOCAL LLM ROUTE:",
            route
        );


        const queryType = route.intent;

        console.log(
            "QUERY TYPE:",
            queryType
        );


        // ========================================
        // 2. FILE COUNT → MONGODB
        // ========================================

        if (queryType === "FILE_COUNT") {

            const extension = route.extension;


            if (!extension) {

                return res.json({

                    success: true,

                    answer:
                        "I couldn't determine the file extension.",

                    sources: [],

                });

            }


            const files =
                await getFilesByExtension(
                    repoName,
                    extension
                );


            console.log(
                `MongoDB: Found ${files.length} ${extension} files`
            );


            return res.json({

                success: true,

                answer:
                    `There are ${files.length} ${extension} files in the repository.`,

                sources:
                    files.map(file => ({

                        file: file.filePath,

                        source: "mongodb",

                    })),

            });

        }


        // ========================================
        // 3. FILE LIST → MONGODB
        // ========================================

        if (queryType === "FILE_LIST") {

            const extension = route.extension;


            if (!extension) {

                return res.json({

                    success: true,

                    answer:
                        "I couldn't determine the file extension.",

                    sources: [],

                });

            }


            const files =
                await getFilesByExtension(
                    repoName,
                    extension
                );


            return res.json({

                success: true,

                answer: files.length

                    ? files
                        .map(
                            (file, index) =>
                                `${index + 1}. ${file.fileName}`
                        )
                        .join("\n")

                    : `No ${extension} files found.`,


                sources:
                    files.map(file => ({

                        file: file.filePath,

                        source: "mongodb",

                    })),

            });

        }


        // ========================================
        // 4. FULL FILE → MONGODB
        // ========================================

        if (queryType === "FULL_FILE") {

            const fileName = route.fileName;


            if (!fileName) {

                return res.json({

                    success: true,

                    answer:
                        "Please specify the file name.",

                    sources: [],

                });

            }


            const file =
                await getFullFile(
                    repoName,
                    fileName
                );


            if (!file) {

                return res.json({

                    success: true,

                    answer:
                        `I couldn't find ${fileName} in the repository.`,

                    sources: [],

                });

            }


            return res.json({

                success: true,

                answer: file.content,

                sources: [

                    {

                        file: file.filePath,

                        source: "mongodb",

                    },

                ],

            });

        }


        // ========================================
        // 5. COMPLEX
        // MONGODB + CHROMADB + GROQ
        // ========================================

        if (queryType === "COMPLEX") {

            console.log(
                "COMPLEX QUERY → MongoDB + ChromaDB"
            );


            const fileName =
                route.fileName;


            let file = null;

            let mongoSource = null;


            // ========================================
            // 5A. MONGODB
            // GET EXACT FILE
            // ========================================

            if (fileName) {

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
                        `MongoDB: ${fileName} not found`
                    );

                }

            }


            // ========================================
            // 5B. CHROMADB
            // SEMANTIC SEARCH
            // ========================================

            console.log(
                "Searching ChromaDB..."
            );


            const results =
                await searchChunks(
                    question,
                    repoName
                );


            const documents =
                results.documents?.[0] || [];


            const metadatas =
                results.metadatas?.[0] || [];


            const chromaContext =
                documents
                    .map(
                        (document, index) => {

                            const metadata =
                                metadatas[index];


                            return `
File: ${metadata?.filePath || "Unknown"}

Relevant Code:

${document}
`;

                        }
                    )
                    .join("\n\n");


            // ========================================
            // 5C. CONTEXT FOR GROQ
            // ========================================

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


            // ========================================
            // 5D. GROQ
            // GENERATE EXPLANATION ONLY
            // ========================================

            console.log(
                "Sending explanation request to Groq..."
            );


            const explanation =
                await askLLM(
                    question,
                    context
                );

            console.log("GROQ EXPLANATION RECEIVED:");
console.log(explanation);
            // ========================================
            // 5E. SOURCES
            // ========================================

            const sources = [];


            if (mongoSource) {

                sources.push(
                    mongoSource
                );

            }


            metadatas.forEach(
                metadata => {

                    sources.push({

                        file:
                            metadata.filePath,

                        chunk:
                            metadata.chunkIndex,

                        source:
                            "chromadb",

                    });

                }
            );


            // ========================================
            // 5F. RESPONSE
            // ========================================

            return res.json({

                success: true,


                // Exact source code
                // Frontend will show this
                // inside a code editor.

                code:
                    file
                        ? file.content
                        : null,


                // File information

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


                // LLM explanation

                explanation,


                sources,

            });

        }


        // ========================================
        // 6. NORMAL CODE QUESTION
        // CHROMADB
        // ========================================

        console.log(
            "Searching ChromaDB..."
        );


        const results =
            await searchChunks(
                question,
                repoName
            );


        const documents =
            results.documents?.[0] || [];


        const metadatas =
            results.metadatas?.[0] || [];


        const context =
            documents
                .map(
                    (document, index) => {

                        const metadata =
                            metadatas[index];


                        return `
File: ${metadata?.filePath || "Unknown"}

Code:

${document}
`;

                    }
                )
                .join("\n\n");


        // ========================================
        // 7. ASK GROQ
        // ========================================

        const answer =
            await askLLM(
                question,
                context
            );


        // ========================================
        // 8. SOURCES
        // ========================================

        const sources =
            metadatas.map(
                metadata => ({

                    file:
                        metadata.filePath,

                    chunk:
                        metadata.chunkIndex,

                    source:
                        "chromadb",

                })
            );


        // ========================================
        // 9. NORMAL RESPONSE
        // ========================================

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