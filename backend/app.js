
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import githubRoutes from "./routes/githubRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
await connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/github", githubRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
export default app;

