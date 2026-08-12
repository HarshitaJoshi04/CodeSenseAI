import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../api";
export default function ChatHistory({
  repositoryId,
  activeSessionId,
  onSelectSession,
}) {
  const [sessions, setSessions] = useState([]);

  const loadSessions = async () => {
    if (!repositoryId) return;
    try {
      const res = await api.get(
        `/api/chat/sessions/${repositoryId}`,
      );
      if (res.data?.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [repositoryId, activeSessionId]);

  const handleDeleteSession = async (sessionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/api/chat/sessions/${sessionId}`,
      );

      // Remove from UI immediately
      setSessions((prev) =>
        prev.filter((session) => session._id !== sessionId),
      );

      // If deleted chat was currently open,
      // clear the active session
      if (sessionId === activeSessionId) {
        onSelectSession(null);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);

      alert("Failed to delete chat session.");
    }
  };

  const handleStartNewChat = async () => {
    if (!repositoryId) return;

    try {
      const res = await api.post("/api/chat/sessions", {
        repositoryId,
        title: `Chat ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      });

      if (res.data?.success) {
        const newSession = res.data.session;

        // IMPORTANT:
        // Immediately update the Home page session list
        setSessions((prev) => [newSession, ...prev]);

        // Make this session active
        onSelectSession(newSession);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  if (!repositoryId) return null;

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700">Chat Sessions</h4>
        <button
          onClick={handleStartNewChat}
          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 font-medium rounded transition"
        >
          + New Chat
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-xs text-slate-400">No previous sessions.</div>
      ) : (
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session._id}
              className={`flex items-center gap-2 rounded transition ${
                session._id === activeSessionId
                  ? "bg-indigo-50"
                  : "hover:bg-slate-50"
              }`}
            >
              {/* Select session */}
              <button
                onClick={() => onSelectSession(session)}
                className={`flex-1 text-left text-xs px-2.5 py-2 flex items-center gap-2 ${
                  session._id === activeSessionId
                    ? "text-indigo-700 font-medium"
                    : "text-slate-600"
                }`}
              >
                <span className="opacity-70">💬</span>

                <span className="truncate">
                  {session.title || "Untitled Session"}
                </span>
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDeleteSession(session._id)}
                className="text-xs px-2 py-2 text-red-500 hover:text-red-700"
                title="Delete chat"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
