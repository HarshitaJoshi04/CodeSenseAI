import { indexRepository } from "../services/repositoryService.js";
import ChatSession from "../models/ChatSession.js";
import Repository from "../models/Repository.js";
import { deleteRepository } from "../services/repositoryDeleteService.js";


export const removeRepository = async (req, res) => {
    try {
        const { repositoryId } = req.params;

        if (!repositoryId) {
            return res.status(400).json({
                success: false,
                message: "Repository ID is required",
            });
        }

        // Make sure this repository belongs to logged-in user
        const repository = await Repository.findOne({
            _id: repositoryId,
            userId: req.userId,
        });

        if (!repository) {
            return res.status(404).json({
                success: false,
                message: "Repository not found or you do not have access to it",
            });
        }
const result = await deleteRepository(repository);

return res.json({
    success: true,
    message: "Repository deleted successfully",
    usage: {
        analysesUsed: 0,
        analysesLimit: req.user.limits.maxRepositories,
    },
    ...result,
});

    } catch (error) {
        console.error("Repository deletion error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const processRepository = async (req, res) => {
    try {
        const { repoUrl } = req.body;

        if (!repoUrl) {
            return res.status(400).json({
                success: false,
                message: "Repository URL is required",
            });
        }

        // Count current repos for the usage response
        const repositoryCount = await Repository.countDocuments({
            userId: req.userId,
        });

        // ==============================
        // ANALYZE REPOSITORY
        // ==============================

        const result = await indexRepository(
            repoUrl,
            req.userId
        );

        // ==============================
        // CREATE CHAT SESSION
        // ==============================

        const chatSession = await ChatSession.create({
            repositoryId: result.repositoryId,
            title: "New Chat",
        });

        // ==============================
        // RESPONSE
        // ==============================

        res.json({
            success: true,

            ...result,

            sessionId: chatSession._id,

            usage: {
                analysesUsed: repositoryCount + 1,
                analysesLimit: req.user.limits.maxRepositories,
            },
        });

    } catch (error) {
        console.error(
            "Repository processing error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};