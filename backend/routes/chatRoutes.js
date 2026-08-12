import express from "express";
import {
    chat,
    getSessions,
    getAllSessions,
    getSessionMessages,
    createSession,
     deleteSession
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/", chat);

router.post("/sessions", createSession);

// All sessions across all repositories
router.get("/sessions", getAllSessions);

// Sessions belonging to one repository
router.get("/sessions/:repositoryId", getSessions);

// Messages belonging to one session
router.get("/sessions/:sessionId/messages", getSessionMessages);
router.delete("/sessions/:sessionId", deleteSession);
export default router;