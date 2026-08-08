import express from "express";
import { processRepository } from "../controllers/githubController.js";

const router = express.Router();

router.post("/process", processRepository);

export default router;

