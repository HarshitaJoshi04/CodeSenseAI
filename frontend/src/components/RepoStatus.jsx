import React from "react";

export default function RepoStatus({ repoState }) {
  if (!repoState) return null;

  if (repoState.status === "idle") {
    return (
      <div className="rounded-xl bg-gradient-to-b from-blue-500 to-sky-500 p-4 text-sm font-bold text-white shadow-lg">
        💧 No repository analyzed yet.
      </div>
    );
  }

  if (repoState.status === "processing") {
    return (
      <div className="rounded-xl bg-gradient-to-b from-blue-500 to-sky-500 p-4 text-sm font-bold text-white shadow-lg">
        🌊 Analyzing repository...
      </div>
    );
  }

  if (repoState.status === "error") {
    return (
      <div className="rounded-xl bg-gradient-to-b from-blue-500 to-sky-500 p-4 text-sm font-bold text-white shadow-lg">
        ⚠ Unable to analyze repository:
        <span className="ml-1 font-medium">
          {repoState.error}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-b from-blue-500 to-sky-500 p-4 text-sm font-bold text-white shadow-lg">
      
      <div className="mb-3">
        ✓ Repository analyzed successfully
      </div>

      <div>
        Repo:{" "}
        <span className="font-mono font-medium">
          {repoState.repoName}
        </span>
      </div>

    </div>
  );
}