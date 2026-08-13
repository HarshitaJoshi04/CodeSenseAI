import React, { useEffect, useState } from "react";
import api from "../api";

export default function HistoryPage({ activeSessionId, onSelectSession }) {
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

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api/chat/sessions/${sessionId}`);
      setSessions((prev) =>
        prev.filter((session) => session._id !== sessionId),
      );
      if (sessionId === activeSessionId) {
        onSelectSession(null);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("Failed to delete chat session.");
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white p-10 shadow-md">
        <div className="flex flex-col items-center justify-center text-center">

          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-blue-500" />

          <p className="text-sm font-bold text-slate-700">
            Loading your conversations...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait a moment
          </p>

        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white p-10 shadow-md">

        <div className="text-center">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-2xl">
            ⚠
          </div>

          <p className="text-sm font-bold text-pink-600">
            {error}
          </p>

          <button
            onClick={loadAllSessions}
            className="
              mt-5
              rounded-xl
              bg-gradient-to-b
              from-blue-500
              to-sky-500
              px-5
              py-2.5
              text-sm
              font-bold
              text-white
              shadow-md
              transition
              hover:from-blue-600
              hover:to-sky-600
            "
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // =========================
  // MAIN
  // =========================

  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-md">

      {/* HEADER */}

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            {/* ICON */}

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-sky-500 text-lg text-white shadow-md">
              💬
            </div>

            {/* TITLE */}

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Chat History
              </h2>

              <p className="mt-0.5 text-sm font-medium text-sky-600">
                Continue a previous conversation with your repositories.
              </p>
            </div>

          </div>

        </div>

        {/* REFRESH */}

        <button
          onClick={loadAllSessions}
          className="
            rounded-xl
            border
            border-sky-200
            bg-sky-50
            px-4
            py-2
            text-sm
            font-bold
            text-blue-600
            transition
            hover:border-sky-300
            hover:bg-sky-100
          "
        >
          <span className="mr-1">↻</span>
          Refresh
        </button>

      </div>

      {/* =========================
          EMPTY STATE
      ========================= */}

      {sessions.length === 0 ? (

        <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 py-16 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl">
            💬
          </div>

          <h3 className="text-lg font-bold text-slate-700">
            No conversations yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Start analyzing a repository and your conversations will appear
            here.
          </p>

        </div>

      ) : (

        /* =========================
           SESSION LIST
        ========================= */

        <div className="space-y-3">

          {sessions.map((session) => (

            <div
              key={session._id}
              className="
                group
                w-full
                rounded-2xl
                border
                border-sky-100
                bg-white
                p-4
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:border-sky-300
                hover:bg-sky-50/60
                hover:shadow-md
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <button
                onClick={() => handleSessionClick(session)}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-start gap-4">
                  {/* ICON */}
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-sky-100
                      text-lg
                      transition
                      group-hover:bg-sky-200
                    "
                  >
                    💬
                  </div>

                  {/* SESSION INFORMATION */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className="
                          truncate
                          font-bold
                          text-slate-800
                          transition
                          group-hover:text-blue-600
                        "
                      >
                        {session.title || "Untitled Session"}
                      </h3>

                      <span className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-400">
                        {formatDate(
                          session.updatedAt || session.createdAt
                        )}
                      </span>
                    </div>

                    {/* REPOSITORY */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-pink-500" />
                      <span className="truncate text-sm font-bold text-sky-600">
                        {session.repositoryId?.repoName ||
                          "Unknown repository"}
                      </span>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="mt-2 text-xs font-medium text-slate-400">
                      Click to continue this conversation
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3">
                {/* DELETE BUTTON */}
                <button
                  onClick={(e) => handleDeleteSession(e, session._id)}
                  className="
                    rounded-xl
                    p-2.5
                    text-slate-300
                    transition-all
                    duration-150
                    opacity-100
                    sm:opacity-0
                    sm:group-hover:opacity-100
                    hover:bg-pink-50
                    hover:text-pink-600
                  "
                  title="Delete conversation"
                >
                  🗑️
                </button>

                {/* ARROW */}
                <div
                  className="
                    hidden
                    self-center
                    text-lg
                    font-bold
                    text-sky-300
                    transition
                    group-hover:translate-x-1
                    group-hover:text-blue-500
                    sm:block
                  "
                >
                  →
                </div>
              </div>
            </div>

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

  const isToday =
    sessionDate.toDateString() === now.toDateString();

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