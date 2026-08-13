import React, { useState, useEffect } from "react";
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

        setSessions((prev) => [newSession, ...prev]);

        onSelectSession(newSession);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  if (!repositoryId) return null;

  return (
    <div className="mt-2 w-full min-w-0">

      {/* HEADER */}
      <div className="
        mb-3
        flex
        flex-col
        gap-3
        xs:flex-row
        xs:items-center
        xs:justify-between
      ">

        {/* TITLE */}
        <div className="flex min-w-0 items-center gap-2">

          <div className="
            flex
            h-8 w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-gradient-to-b
            from-blue-500
            to-sky-500
            text-white
            shadow-sm
          ">
            💬
          </div>

          <div className="min-w-0">

            <h4 className="
              truncate
              text-xs
              font-extrabold
              text-slate-800
            ">
              Chat Sessions
            </h4>

            <p className="
              truncate
              text-[10px]
              font-medium
              text-cyan-600
            ">
              Your conversations
            </p>

          </div>

        </div>


        {/* NEW CHAT */}
        <button
          onClick={handleStartNewChat}
          className="
            w-full
            shrink-0
            rounded-lg
            bg-gradient-to-b
            from-blue-500
            to-sky-500
            px-3
            py-2
            text-[10px]
            font-bold
            text-white
            shadow-md
            shadow-sky-200
            transition-all
            duration-200

            hover:from-blue-600
            hover:to-sky-600
            hover:shadow-lg

            xs:w-auto
          "
        >
          + New Chat
        </button>

      </div>


      {/* EMPTY STATE */}
      {sessions.length === 0 ? (

        <div className="
          w-full
          rounded-xl
          border
          border-dashed
          border-cyan-200
          bg-gradient-to-br
          from-cyan-50
          to-sky-50
          px-3
          py-6
          text-center
          sm:px-4
        ">

          <div className="
            mx-auto
            mb-2
            flex
            h-10 w-10
            items-center
            justify-center
            rounded-xl
            bg-white
            text-xl
            shadow-sm
          ">
            💬
          </div>

          <p className="
            text-xs
            font-bold
            text-slate-700
          ">
            No previous sessions
          </p>

          <p className="
            mt-1
            text-[10px]
            font-medium
            text-cyan-600
          ">
            Start a new chat to begin.
          </p>

        </div>

      ) : (

        /* SESSION LIST */
        <div className="
          max-h-56
          w-full
          space-y-1.5
          overflow-x-hidden
          overflow-y-auto
          pr-1
          sm:max-h-64
        ">

          {sessions.map((session) => {

            const isActive =
              session._id === activeSessionId;

            return (
              <div
                key={session._id}
                className={`
                  group
                  flex
                  w-full
                  min-w-0
                  items-center
                  gap-1
                  rounded-xl
                  border
                  transition-all
                  duration-200

                  ${
                    isActive
                      ? `
                        border-cyan-300
                        bg-gradient-to-r
                        from-cyan-50
                        to-sky-50
                        shadow-sm
                        shadow-cyan-100
                      `
                      : `
                        border-transparent
                        bg-slate-50
                        hover:border-cyan-200
                        hover:bg-cyan-50
                      `
                  }
                `}
              >

                {/* SELECT SESSION */}
                <button
                  onClick={() => onSelectSession(session)}
                  className={`
                    flex
                    min-w-0
                    flex-1
                    items-center
                    gap-2
                    overflow-hidden
                    rounded-xl
                    px-2
                    py-2

                    text-left
                    sm:px-2.5

                    ${
                      isActive
                        ? "text-blue-600"
                        : "text-slate-600"
                    }
                  `}
                >

                  {/* CHAT ICON */}
                  <span
                    className={`
                      flex
                      h-7 w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg

                      ${
                        isActive
                          ? `
                            bg-gradient-to-b
                            from-blue-500
                            to-sky-500
                            text-white
                            shadow-sm
                          `
                          : `
                            bg-cyan-100
                            text-cyan-600
                          `
                      }
                    `}
                  >
                    💬
                  </span>


                  {/* SESSION NAME */}
                  <span className="
                    min-w-0
                    flex-1
                    overflow-hidden
                  ">

                    <span
                      className={`
                        block
                        truncate
                        text-[11px]

                        ${
                          isActive
                            ? "font-extrabold text-blue-700"
                            : "font-semibold text-slate-700"
                        }
                      `}
                    >
                      {session.title || "Untitled Session"}
                    </span>

                    {isActive && (
                      <span className="
                        mt-0.5
                        block
                        truncate
                        text-[9px]
                        font-bold
                        text-cyan-600
                      ">
                        Active conversation
                      </span>
                    )}

                  </span>

                </button>


                {/* DELETE */}
                <button
                  onClick={() =>
                    handleDeleteSession(session._id)
                  }
                  className="
                    mr-1
                    shrink-0
                    rounded-lg
                    px-2
                    py-1.5
                    text-[11px]
                    text-slate-300
                    opacity-100
                    transition-all
                    duration-200

                    sm:opacity-0
                    sm:group-hover:opacity-100

                    hover:bg-cyan-100
                    hover:text-cyan-700
                  "
                  title="Delete chat"
                >
                  🗑️
                </button>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}