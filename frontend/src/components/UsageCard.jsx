
import React from "react";

export default function UsageCard({ usage }) {
  const analysesUsed = usage?.analysesUsed ?? 0;
  const analysesLimit = usage?.analysesLimit ?? 1;

  const percentage =
    analysesLimit > 0
      ? Math.min((analysesUsed / analysesLimit) * 100, 100)
      : 0;

  const isFull = analysesUsed >= analysesLimit;
  const hasSlot = analysesUsed < analysesLimit;

  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-white/90 shadow-lg shadow-cyan-100/60 backdrop-blur">

      {/* HEADER */}
      <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-sky-50 px-5 py-4">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
              ⚡
            </div>

            <div>
              <h3 className="text-base font-bold text-cyan-900">
                Usage
              </h3>

              <p className="mt-1 text-xs text-cyan-600">
                Active repository analysis
              </p>
            </div>

          </div>

          {/* STATUS */}
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              isFull
                ? "border border-amber-200 bg-amber-50 text-amber-600"
                : "border border-emerald-200 bg-emerald-50 text-emerald-600"
            }`}
          >
            {isFull ? "FULL" : "AVAILABLE"}
          </span>

        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">

        {/* COUNT */}
        <div className="flex items-end justify-between">

          <div>
            <p className="text-xs font-medium text-slate-500">
              Repository Analysis
            </p>

            <p className="mt-1 text-2xl font-extrabold text-cyan-900">
              {analysesUsed}
              <span className="text-sm font-semibold text-slate-400">
                {" "}/ {analysesLimit}
              </span>
            </p>
          </div>

          <span className="text-xs font-bold text-cyan-600">
            {Math.round(percentage)}%
          </span>

        </div>

        {/* PROGRESS BAR */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-cyan-100">

          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-500"
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>

        {/* STATUS MESSAGE */}
        <div
          className={`mt-4 rounded-xl border px-3 py-3 ${
            isFull
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >

          {isFull ? (
            <>
              <p className="text-xs font-bold text-amber-700">
                Analysis slot is currently in use
              </p>

              <p className="mt-1 text-[11px] leading-4 text-amber-600">
                Delete the current repository to free this analysis slot
                and analyze another repository.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-emerald-700">
                Analysis slot available
              </p>

              <p className="mt-1 text-[11px] leading-4 text-emerald-600">
                You can analyze a repository now.
              </p>
            </>
          )}

        </div>

      </div>

    </section>
  );
}

