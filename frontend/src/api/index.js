import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const analyzeRepository = async (repoUrl) => {
  const response = await api.post("/api/github/process", {
    repoUrl,
  });

  return response.data;
};

export const askQuestion = async (question,repoName) => {
  const response = await api.post("/api/chat", {
    question,
    repoName
  });

  return response.data;
};