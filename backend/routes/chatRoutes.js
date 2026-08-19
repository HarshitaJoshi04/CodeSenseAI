import express from "express";
import {
    chat,
    getSessions,
    getAllSessions,
    getSessionMessages,
    createSession,
    deleteSession
} from "../controllers/chatController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All chat routes require authentication
router.post("/", protect, chat);

router.post("/sessions", protect, createSession);

// All sessions across the authenticated user's repositories
router.get("/sessions", protect, getAllSessions);

// Sessions belonging to one repository (must be user's own)
router.get("/sessions/:repositoryId", protect, getSessions);

// Messages belonging to one session (must be user's own)
router.get("/sessions/:sessionId/messages", protect, getSessionMessages);

router.delete("/sessions/:sessionId", protect, deleteSession);

export default router;