import React, { useReducer, useEffect } from "react";

import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import SourcesList from "./SourcesList";
import api, { askQuestion } from "../api";

const initialState = {
  messages: [],
  lastSources: [],
  thinking: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "add_user":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            role: "user",
            content: String(action.payload),
          },
        ],
      };

    case "add_assistant":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            role: "assistant",
            code: action.payload.code || "",
            explanation: action.payload.explanation || "",
            answer: action.payload.answer || "",
          },
        ],
        thinking: false,
      };

    case "load_messages":
      return {
        ...state,
        messages: action.payload.map((msg) => ({
          role: msg.role,
          content: msg.content || "",
          code: msg.code || "",
          explanation: msg.explanation || "",
          answer: msg.answer || "",
        })),
        thinking: false,
      };

    case "clear_messages":
      return {
        ...state,
        messages: [],
        lastSources: [],
        thinking: false,
      };

    case "set_thinking":
      return {
        ...state,
        thinking: action.payload,
      };

    case "set_sources":
      return {
        ...state,
        lastSources: action.payload || [],
      };

    default:
      return state;
  }
}

export default function ChatPanel({ chatContext, repoState }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const sessionId =
    chatContext?.sessionId ||
    localStorage.getItem("currentSessionId");

  const repositoryId =
    chatContext?.repositoryId ||
    localStorage.getItem("currentRepositoryId");

  const repoName =
    chatContext?.repoName ||
    repoState?.repoName ||
    localStorage.getItem("currentRepoName");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) {
        dispatch({ type: "clear_messages" });
        return;
      }

      try {
        const res = await api.get(
          `/api/chat/sessions/${sessionId}/messages`
        );

        if (!res.data?.success) return;

        const messages = res.data.messages || [];

        dispatch({
          type: "load_messages",
          payload: messages,
        });

        const assistantMessages = messages.filter(
          (message) => message.role === "assistant"
        );

        if (assistantMessages.length > 0) {
          const lastMessage =
            assistantMessages[assistantMessages.length - 1];

          dispatch({
            type: "set_sources",
            payload: lastMessage.sources || [],
          });
        } else {
          dispatch({
            type: "set_sources",
            payload: [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };

    fetchHistory();
  }, [sessionId]);

  const handleSend = async (text) => {
    if (!text || !text.trim()) return;

    if (repoState?.status !== "success" && !repoName) {
      alert("Please analyze a repository first.");
      return;
    }

    if (!sessionId) {
      alert("No chat session found. Please create a new chat.");
      return;
    }

    dispatch({
      type: "add_user",
      payload: text,
    });

    dispatch({
      type: "set_thinking",
      payload: true,
    });

    try {
      const res = await askQuestion(
        text,
        repoName,
        sessionId
      );

      if (res?.success) {
        dispatch({
          type: "add_assistant",
          payload: {
            code:
              typeof res.code === "string"
                ? res.code
                : "",

            explanation:
              typeof res.explanation === "string"
                ? res.explanation
                : "",

            answer:
              typeof res.answer === "string"
                ? res.answer
                : "",
          },
        });

        dispatch({
          type: "set_sources",
          payload: Array.isArray(res.sources)
            ? res.sources
            : [],
        });
      } else {
        dispatch({
          type: "add_assistant",
          payload: {
            answer: "Unable to get answer from server.",
            code: "",
            explanation: "",
          },
        });
      }
    } catch (err) {
      console.error("Chat error:", err);

      dispatch({
        type: "add_assistant",
        payload: {
          answer: `Error: ${err.message}`,
          code: "",
          explanation: "",
        },
      });
    }
  };

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-1
        flex-col
        overflow-hidden
        bg-gradient-to-b
        from-[#082f49]
        via-[#075985]
        to-[#0c4a6e]
      "
    >

      {/* ================= CHAT ================= */}

      <div
        className="
          min-h-0
          min-w-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          bg-gradient-to-b
          from-[#082f49]
          via-[#075985]
          to-[#0e7490]
          p-3
          sm:p-4
          md:p-5
        "
      >

        <div className="mx-auto w-full max-w-5xl min-w-0">

          {/* EMPTY STATE */}

          {state.messages.length === 0 && !state.thinking && (
            <div
              className="
                flex
                min-h-[300px]
                items-center
                justify-center
                px-2
                py-10
                sm:min-h-[360px]
                sm:px-4
                md:min-h-[420px]
              "
            >

              <div className="w-full max-w-md text-center">

                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-b
                    from-blue-400
                    to-sky-500
                    shadow-xl
                    shadow-sky-900/40
                    sm:mb-5
                    sm:h-16
                    sm:w-16
                  "
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-white sm:h-8 sm:w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M21 12a8.5 8.5 0 01-9 8 9.4 9.4 0 01-4-.9L3 21l1.7-4.2A8 8 0 013 12a8.5 8.5 0 0118 0z"
                    />
                  </svg>

                </div>

                <h2
                  className="
                    text-xl
                    font-bold
                    text-white
                    sm:text-2xl
                  "
                >
                  Ask CodeSense AI
                </h2>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-sm
                    text-xs
                    leading-5
                    text-sky-100/70
                    sm:text-sm
                    sm:leading-6
                  "
                >
                  Ask questions about your repository,
                  files, components, functions, or code.
                </p>

                {repoName && (
                  <div
                    className="
                      mx-auto
                      mt-4
                      inline-flex
                      max-w-full
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-sky-300/30
                      bg-sky-300/10
                      px-3
                      py-1.5
                      text-[10px]
                      font-semibold
                      text-sky-100
                      sm:mt-5
                      sm:px-4
                      sm:py-2
                      sm:text-xs
                    "
                  >

                    <span className="h-2 w-2 shrink-0 rounded-full bg-sky-300 shadow-sm shadow-sky-300" />

                    <span className="max-w-[220px] truncate sm:max-w-[300px]">
                      {repoName}
                    </span>

                  </div>
                )}

              </div>

            </div>
          )}

          {/* MESSAGES */}

          {state.messages.length > 0 && (
            <div
              className="
                min-w-0
                overflow-hidden
                rounded-xl
                border
                border-sky-300/20
                bg-[#082f49]/40
                p-2
                shadow-2xl
                backdrop-blur-sm
                sm:rounded-2xl
                sm:p-3
              "
            >

              <MessageList
                messages={state.messages}
              />

            </div>
          )}

          {/* THINKING */}

          {state.thinking && (
            <div
              className="
                mt-3
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-sky-300/20
                bg-sky-300/10
                px-3
                py-2.5
                sm:mt-4
                sm:gap-3
                sm:px-4
                sm:py-3
              "
            >

              <div className="flex shrink-0 gap-1">

                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300" />

                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-blue-300"
                  style={{
                    animationDelay: "150ms",
                  }}
                />

                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"
                  style={{
                    animationDelay: "300ms",
                  }}
                />

              </div>

              <span
                className="
                  min-w-0
                  truncate
                  text-xs
                  font-medium
                  text-sky-100/70
                  sm:text-sm
                "
              >
                CodeSense AI is thinking...
              </span>

            </div>
          )}

        </div>

      </div>

      {/* ================= INPUT ================= */}

      <div
        className="
          shrink-0
          border-t
          border-sky-300/20
          bg-[#082f49]
          p-3
          sm:p-4
          md:p-5
        "
      >

        <div className="mx-auto w-full max-w-5xl">

          <div
            className="
              min-w-0
              rounded-xl
              border
              border-sky-300/30
              bg-[#0c4a6e]
              p-1.5
              shadow-lg
              shadow-black/20
              transition
              focus-within:border-sky-300
              sm:rounded-2xl
              sm:p-2
            "
          >

            <MessageInput
              onSend={handleSend}
              disabled={state.thinking}
            />

          </div>

          <p
            className="
              mt-1.5
              hidden
              text-center
              text-[10px]
              text-sky-100/40
              sm:block
              sm:text-[11px]
            "
          >
            CodeSense AI can analyze your repository
            and explain your code.
          </p>

        </div>

      </div>

      {/* ================= SOURCES ================= */}

      {state.lastSources.length > 0 && (
        <div
          className="
            max-h-[220px]
            shrink-0
            overflow-y-auto
            border-t
            border-sky-300/20
            bg-[#082f49]
            px-3
            py-3
            sm:max-h-[260px]
            sm:px-4
            sm:py-4
            md:px-5
          "
        >

          <div className="mx-auto w-full max-w-5xl min-w-0">

            <div className="mb-2 flex items-center gap-2 sm:mb-3">

              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-sky-300/10
                  sm:h-8
                  sm:w-8
                "
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-sky-300 sm:h-4 sm:w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12M6 12h12"
                  />
                </svg>

              </div>

              <div className="min-w-0">

                <h3 className="text-xs font-bold text-white sm:text-sm">
                  Sources
                </h3>

                <p className="truncate text-[9px] text-sky-100/50 sm:text-[11px]">
                  Repository files used for this answer
                </p>

              </div>

            </div>

            <div
              className="
                min-w-0
                overflow-hidden
                rounded-xl
                border
                border-sky-300/20
                bg-[#0c4a6e]
                p-2
                sm:p-3
              "
            >

              <SourcesList
                sources={state.lastSources}
              />

            </div>

          </div>

        </div>
      )}

    </div>
  );
}