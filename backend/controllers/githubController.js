import { indexRepository } from "../services/repositoryService.js";
import ChatSession from "../models/ChatSession.js";
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

        const result = await deleteRepository(repositoryId);

        return res.json({
            success: true,
            message: "Repository deleted successfully",
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

    //repo scanning logic
   const result = await indexRepository(
    repoUrl,
    req.userId
);

    // Create a NEW chat session
    const chatSession = await ChatSession.create({
      repositoryId: result.repositoryId,
      title: "New Chat",
    });

    res.json({
      success: true,

      ...result,

      sessionId: chatSession._id,
    });
  } catch (error) {
    console.error("Repository processing error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
