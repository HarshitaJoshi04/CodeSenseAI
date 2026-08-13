import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

/**
 * Sends a single chunk to the AI Service
 * AI Service generates embedding + stores it in ChromaDB
 */



export const searchChunks = async (query, repoName, repoId = null, filePath = null) => {

    const response = await axios.post(

        `${AI_SERVICE_URL}/search`,

        {
            query,
            repoName,
            repoId,
            filePath,
            top_k: 5
        }

    );

    return response.data;

};
export const storeChunk = async (chunk) => {

    try {

        const response = await axios.post(
            `${AI_SERVICE_URL}/store`,
            {
                id: chunk.id,
                text: chunk.text,
                metadata: chunk.metadata
            }
        );

        return response.data;

    } catch (error) {

        console.error("Error storing chunk:", error.message);

        throw error;
    }

};