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

  //Active session and repository context

  const sessionId =
    chatContext?.sessionId || localStorage.getItem("currentSessionId");

  const repositoryId =
    chatContext?.repositoryId || localStorage.getItem("currentRepositoryId");

  const repoName =
    chatContext?.repoName ||
    repoState?.repoName ||
    localStorage.getItem("currentRepoName");

  // ==================================================
  // LOAD SELECTED SESSION
  // ==================================================

useEffect(() => {
  const fetchHistory = async () => {
    if (!sessionId) {
      dispatch({
        type: "clear_messages",
      });
      return;
    }

    console.log("Loading chat session:", sessionId);

    try {
      const res = await api.get(
        `/api/chat/sessions/${sessionId}/messages`
      );

      if (!res.data?.success) {
        console.warn("Failed to load chat session:", res.data);
        return;
      }

      const messages = res.data.messages || [];

      console.log("Loaded messages:", messages);

      // Load messages once
      dispatch({
        type: "load_messages",
        payload: messages,
      });

      // Find latest assistant message
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

      // Information about the session/repository
      const session = res.data.session;

      if (session) {
        console.log(
          "Loaded historical session for:",
          session.repositoryId?.repoName
        );
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  };

  fetchHistory();
}, [sessionId]);

  //send message

  const handleSend = async (text) => {
    if (!text || !text.trim()) {
      return;
    }

    console.log("Sending question:", text);

    console.log("ACTIVE SESSION:", sessionId);

    console.log("ACTIVE REPOSITORY:", repositoryId);

    console.log("REPOSITORY NAME:", repoName);

    // Check repository

    if (repoState?.status !== "success" && !repoName) {
      alert("Please analyze a repository first.");

      return;
    }

    // Check session

    if (!sessionId) {
      alert("No chat session found. Please create a new chat.");

      return;
    }

    // Add user message immediately

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
        sessionId,
      );

      console.log("CHAT RESPONSE:", res);

      if (res?.success) {
        dispatch({
          type: "add_assistant",

          payload: {
            code: typeof res.code === "string" ? res.code : "",

            explanation:
              typeof res.explanation === "string" ? res.explanation : "",

            answer: typeof res.answer === "string" ? res.answer : "",
          },
        });

        dispatch({
          type: "set_sources",

          payload: Array.isArray(res.sources) ? res.sources : [],
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
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-auto border rounded p-3">
        <MessageList messages={state.messages} />
      </div>

      <div className="mt-3">
        <MessageInput onSend={handleSend} disabled={state.thinking} />
      </div>

      <div className="mt-4">
        <SourcesList sources={state.lastSources} />
      </div>
    </div>
  );
}
