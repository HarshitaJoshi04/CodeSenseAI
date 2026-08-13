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
      setError(
        "Repository URL must start with https://github.com/user/repo"
      );
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
        setRepoState({
          status: "success",
          repoName: data.repoName,
          files: data.files,
          chunks: data.chunks,
          error: null,
        });

        setChatContext((prev) => ({
          ...prev,
          processed: true,
          repoName: data.repoName,
          repositoryId: data.repositoryId,
          sessionId: data.sessionId,
        }));

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
          error:
            data?.error ||
            "Unable to analyze repository",
        });
      }
    } catch (err) {
      console.error("Analyze error:", err);

      setRepoState({
        status: "error",
        repoName: null,
        files: 0,
        chunks: 0,
        error:
          err.message ||
          "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* REPOSITORY URL */}
      <div>
        <label
          htmlFor="github-repo-url"
          className="mb-2 block text-sm font-bold text-cyan-700"
        >
          GitHub Repository URL
        </label>

        <div className="relative">

          {/* GitHub Icon */}
          <div
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              flex
              -translate-y-1/2
              text-cyan-600
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 .7a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .7Z" />
            </svg>
          </div>

          <input
            id="github-repo-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="
              w-full
              rounded-xl
              border-2
              border-cyan-200
              bg-cyan-50
              py-3
              pl-10
              pr-4
              text-sm
              font-medium
              text-cyan-900
              placeholder:text-cyan-400
              outline-none
              transition

              focus:border-cyan-400
              focus:ring-4
              focus:ring-cyan-100

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
            placeholder="https://github.com/user/repository"
            aria-label="GitHub repository URL"
          />
        </div>

        <p className="mt-2 text-xs text-cyan-600">
          Enter a public GitHub repository to analyze.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="
            rounded-xl
            border-2
            border-cyan-200
            bg-cyan-50
            px-3
            py-3
            text-sm
            font-semibold
            text-cyan-700
          "
        >
          ⚠ {error}
        </div>
      )}

      {/* ANALYZE BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          rounded-xl
          bg-gradient-to-b
          from-cyan-500
          to-sky-500
          px-4
          py-3
          text-sm
          font-bold
          text-white
          shadow-lg
          shadow-cyan-300/30
          transition

          hover:from-cyan-600
          hover:to-sky-600

          focus:outline-none
          focus:ring-4
          focus:ring-cyan-200

          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        <span className="flex items-center justify-center gap-2">

          {loading ? (
            <>
              <span
                className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-white/40
                  border-t-white
                "
              />

              Analyzing repository...
            </>
          ) : (
            <>
              🌊
              Analyze Repository
            </>
          )}

        </span>
      </button>

      {/* INFO */}
      <div
        className="
          rounded-xl
          border
          border-cyan-200
          bg-gradient-to-r
          from-cyan-50
          to-sky-50
          px-3
          py-3
        "
      >
        <p className="text-xs font-medium leading-5 text-cyan-700">
          💧 Make sure the repository is public or accessible
          to the backend.
        </p>
      </div>

    </form>
  );
}