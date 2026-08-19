import express from "express";
import {
    processRepository,
    removeRepository,
} from "../controllers/githubController.js";

const router = express.Router();

router.post("/process", processRepository);
router.delete("/repository/:repositoryId", removeRepository);
export default router;

