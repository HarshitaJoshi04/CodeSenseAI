import React from "react";

export default function SourcesList({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">

      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span>📚</span>

        <h3 className="text-sm font-bold text-pink-500">
          Sources
        </h3>
      </div>

      {/* Sources */}
      <div className="space-y-2">
        {sources.map((s, idx) => (
          <div
            key={idx}
            className="
              flex items-center gap-2
              rounded-lg
              border border-sky-200
              bg-sky-100
              px-3 py-2
            "
          >
            <span>📄</span>

            <span className="min-w-0 flex-1 truncate font-mono text-xs font-bold text-sky-800">
              {s.file}
            </span>

          </div>
        ))}
      </div>

    </div>
  );
}