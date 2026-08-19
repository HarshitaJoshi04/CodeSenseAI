import React from "react";

export default function RepoStatus({
  repoState,
  repositoryId,
  onDelete,
}) {
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

      {/* DELETE BUTTON */}
      {repositoryId && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="
            mt-4
            w-full
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-2
            text-sm
            font-bold
            text-red-600
            transition

            hover:bg-red-100
            hover:text-red-700

            focus:outline-none
            focus:ring-4
            focus:ring-red-100
          "
        >
          🗑 Delete Repository
        </button>
      )}

    </div>
  );
}