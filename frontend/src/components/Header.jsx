import React from "react";

export default function Header({ currentPage, onNavigate, onNewAnalysis }) {
  return (
    <header className="bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded flex items-center justify-center font-bold">
            CS
          </div>

          <div>
            <h1 className="text-xl font-semibold">CodeSenseAI</h1>

            <div className="text-sm text-slate-200">
              Repository-aware developer assistant
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("home")}
            className="px-4 py-2 bg-indigo-500 rounded"
          >
            🏠 Home
          </button>

          <button
            onClick={() => onNavigate("history")}
            className="px-4 py-2 hover:bg-slate-700 rounded"
          >
            📚 History
          </button>

          <button
            onClick={onNewAnalysis}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded"
          >
            ＋ New Analysis
          </button>
        </div>
      </div>
    </header>
  );
}
