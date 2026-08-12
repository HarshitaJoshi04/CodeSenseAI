import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },

    title: {
      type: String,
      default: "New Chat",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;