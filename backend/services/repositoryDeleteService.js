import fs from "fs/promises";
import axios from "axios";

import Repository from "../models/Repository.js";
import ChatSession from "../models/ChatSession.js";
import ChatMessage from "../models/ChatMessage.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

export const deleteRepository = async (repositoryId) => {
    // 1. Find repository
    const repository = await Repository.findById(repositoryId);

    if (!repository) {
        throw new Error("Repository not found");
    }

    // 2. Delete all chat sessions belonging to this repository
    const sessions = await ChatSession.find({
        repositoryId: repository._id,
    }).select("_id");

    const sessionIds = sessions.map((session) => session._id);

    // 3. Delete messages belonging to those sessions
    if (sessionIds.length > 0) {
        await ChatMessage.deleteMany({
            sessionId: { $in: sessionIds },
        });
    }

    // 4. Delete chat sessions
    await ChatSession.deleteMany({
        repositoryId: repository._id,
    });

    // 5. Delete repository from MongoDB
    await Repository.findByIdAndDelete(repository._id);

    // 6. Delete cloned repository from server
    try {
        await fs.rm(repository.repoPath, {
            recursive: true,
            force: true,
        });
    } catch (error) {
        console.error(
            "Failed to delete cloned repository:",
            error.message
        );
    }

    // 7. Delete repository chunks from ChromaDB
    try {
        await axios.delete(
            `${AI_SERVICE_URL}/repository/${repository._id}`
        );
    } catch (error) {
        console.error(
            "Failed to delete ChromaDB chunks:",
            error.message
        );
    }

    return {
        repositoryId: repository._id,
        repoName: repository.repoName,
    };
};