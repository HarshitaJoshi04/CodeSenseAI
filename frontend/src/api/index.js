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

export const deleteRepository = async (repositoryId) => {
  const response = await api.delete(
    `/api/github/repository/${repositoryId}`
  );

  return response.data;
};


export const askQuestion = async (question,repoName,sessionId) => {
  const response = await api.post("/api/chat", {
    question,
    repoName,
    sessionId,
  });

  return response.data;
};



export default api;