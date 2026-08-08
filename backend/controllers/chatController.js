
import { searchChunks } from "../services/aiService.js";
import { askLLM } from "../services/llmService.js";

export const chat = async (req, res) => {

    try {

        const { question } = req.body;

        // 1. Search repository
        const results = await searchChunks(question);

        // 2. Build context for LLM

const context = results.documents[0]
    .map((document, index) => {

        const metadata = results.metadatas[0][index];

        const filePath = metadata.filePath
            .replace(/^repos[\\/]+BlogApp[\\/]+/, "");

        return `
File: ${filePath}

Code:
${document}
`;

    })
    .join("\n\n");


        // 3. Ask Groq
        const answer = await askLLM(
            question,
            context
        );

        // 4. Extract source files
        const sources = results.metadatas[0].map((metadata) => ({
            file: metadata.filePath.replace(/^repos[\\/]+BlogApp[\\/]+/, ""),
            chunk: metadata.chunkIndex
        }));

        // 5. Return answer + sources
        res.json({
            success: true,
            answer,
            sources
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

