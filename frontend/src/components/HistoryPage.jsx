import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../api";
export default function HistoryPage({ onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllSessions();
  }, []);

  const loadAllSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/chat/sessions");

      if (res.data?.success) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setError("Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    onSelectSession(session);
  };

  if (loading) {
    return (
      <div className="bg-white rounded shadow p-8">
        <div className="text-center text-slate-500">
          Loading your conversations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded shadow p-8">
        <div className="text-center text-red-500">{error}</div>

        <div className="text-center mt-4">
          <button
            onClick={loadAllSessions}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            Chat History
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Continue a previous conversation with your repositories.
          </p>
        </div>

        <button
          onClick={loadAllSessions}
          className="text-sm px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Empty state */}
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">💬</div>

          <h3 className="text-lg font-semibold text-slate-700">
            No conversations yet
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Start analyzing a repository and your conversations will appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <button
              key={session._id}
              onClick={() => handleSessionClick(session)}
              className="w-full text-left border border-slate-200 rounded-lg p-4 hover:bg-slate-50 hover:border-indigo-200 transition"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-lg">
                  💬
                </div>

                {/* Session information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-slate-800 truncate">
                      {session.title || "Untitled Session"}
                    </h3>

                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(session.updatedAt || session.createdAt)}
                    </span>
                  </div>

                  <div className="text-sm text-indigo-600 mt-1">
                    {session.repositoryId?.repoName || "Unknown repository"}
                  </div>

                  <div className="text-xs text-slate-400 mt-2">
                    Click to continue this conversation
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(date) {
  if (!date) return "";

  const sessionDate = new Date(date);
  const now = new Date();

  const isToday = sessionDate.toDateString() === now.toDateString();

  if (isToday) {
    return sessionDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return sessionDate.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
