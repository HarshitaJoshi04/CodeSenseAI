
import express from "express";
import cors from "cors";

import githubRoutes from "./routes/githubRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/github", githubRoutes);
app.use("/api/chat", chatRoutes);

export default app;

