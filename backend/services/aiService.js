import axios from "axios";

const AI_SERVICE_URL = "http://127.0.0.1:8000";

/**
 * Sends a single chunk to the AI Service
 * AI Service generates embedding + stores it in ChromaDB
 */



export const searchChunks = async (query,repoName) => {

    const response = await axios.post(

        `${AI_SERVICE_URL}/search`,

        {
            query,
            repoName,
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