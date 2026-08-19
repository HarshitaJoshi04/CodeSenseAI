import express from "express";

import { processRepository } from "../controllers/githubController.js";
import { protect } from "../middleware.js/authMiddleware.js";

const router = express.Router();

router.post(
    "/process",
    protect,
    processRepository
);

export default router;