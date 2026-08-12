import { indexRepository } from "../services/repositoryService.js";
import ChatSession from "../models/ChatSession.js";
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
    const result = await indexRepository(repoUrl);

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
