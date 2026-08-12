import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatSession",
            required: true,
        },

        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
        },

        content: {
            type: String,
            default: "",
        },

        code: {
            type: String,
            default: "",
        },

        explanation: {
            type: String,
            default: "",
        },

        answer: {
            type: String,
            default: "",
        },

        sources: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const ChatMessage = mongoose.model(
    "ChatMessage",
    chatMessageSchema
);

export default ChatMessage;