import React, { useState } from "react";
import { analyzeRepository } from "../api";

export default function RepoForm({ setRepoState, setChatContext }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function validateGithubUrl(value) {
    return /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/.test(value);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    if (!validateGithubUrl(url.trim())) {
      setError("Repository URL must start with https://github.com/user/repo");
      return;
    }

    try {
      setLoading(true);

      setRepoState({
        status: "processing",
        repoName: null,
        files: 0,
        chunks: 0,
        error: null,
      });

      const data = await analyzeRepository(url.trim());

      console.log("ANALYZE RESPONSE:", data);

      if (data?.success) {
        // Repository state

        setRepoState({
          status: "success",
          repoName: data.repoName,
          files: data.files,
          chunks: data.chunks,
          error: null,
        });

        // Create active chat context

        setChatContext((prev) => ({
          ...prev,
          processed: true,
          repoName: data.repoName,
          repositoryId: data.repositoryId,
          sessionId: data.sessionId,
        }));

        // Persist active repository/session

        localStorage.setItem("currentSessionId", data.sessionId);

        localStorage.setItem("currentRepositoryId", data.repositoryId);

        localStorage.setItem("currentRepoName", data.repoName);

        localStorage.setItem("currentRepoFiles", data.files);

        localStorage.setItem("currentRepoChunks", data.chunks);
      } else {
        setRepoState({
          status: "error",
          repoName: null,
          files: 0,
          chunks: 0,
          error: data?.error || "Unable to analyze repository",
        });
      }
    } catch (err) {
      console.error("Analyze error:", err);

      setRepoState({
        status: "error",
        repoName: null,
        files: 0,
        chunks: 0,
        error: err.message || "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          GitHub Repository URL
        </label>

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 block w-full rounded border-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="https://github.com/user/repository"
          aria-label="GitHub repository URL"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Analyzing repository..." : "Analyze Repository"}
        </button>

        <div className="text-sm text-slate-500">
          Ensure the repository is public or accessible to the backend.
        </div>
      </div>
    </form>
  );
}
