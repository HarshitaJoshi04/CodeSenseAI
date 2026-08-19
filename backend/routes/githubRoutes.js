import express from "express";

import {
  processRepository,
  removeRepository,
} from "../controllers/githubController.js";

import { protect } from "../middleware.js/authMiddleware.js";
import { analysisLimit } from "../middleware.js/limitMiddleware.js";

const router = express.Router();

router.post(
  "/process",
  protect,
  analysisLimit,
  processRepository
);

router.delete(
  "/repository/:repositoryId",
  protect,
  removeRepository
);

export default router;
