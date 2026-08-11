import React, { useReducer } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import SourcesList from "./SourcesList";
import { askQuestion } from "../api";

const initialState = {
    messages: [],
    lastSources: null,
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

        case "set_thinking":
            return {
                ...state,
                thinking: action.payload,
            };

        case "set_sources":
            return {
                ...state,
                lastSources: action.payload,
            };

        default:
            return state;
    }
}

export default function ChatPanel({ chatContext, repoState }) {

    const [state, dispatch] = useReducer(
        reducer,
        initialState
    );

    const handleSend = async (text) => {

        console.log("Sending question:", repoState);

        if (!text || !text.trim()) {
            return;
        }

        if (repoState.status !== "success") {
            alert("Please analyze a repository first");
            return;
        }

        // Add user message
        dispatch({
            type: "add_user",
            payload: text,
        });

        // Show thinking
        dispatch({
            type: "set_thinking",
            payload: true,
        });

        try {

            const res = await askQuestion(
                text,
                repoState.repoName
            );

            console.log("CHAT RESPONSE:", res);

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
                        answer:
                            "Unable to get answer from server.",
                        code: "",
                        explanation: "",
                    },
                });

            }

        } catch (err) {

            console.error(
                "Chat error:",
                err
            );

            dispatch({
                type: "add_assistant",
                payload: {
                    answer:
                        `Error: ${err.message}`,
                    code: "",
                    explanation: "",
                },
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full">

            <div className="flex-1 overflow-auto border rounded p-3">

                <MessageList
                    messages={state.messages}
                />

            </div>

            <div className="mt-3">

                <MessageInput
                    onSend={handleSend}
                    disabled={state.thinking}
                />

            </div>

            <div className="mt-4">

                <SourcesList
                    sources={state.lastSources}
                />

            </div>

        </div>
    );
}