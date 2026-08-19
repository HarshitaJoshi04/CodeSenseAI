import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // =========================
    // USER LIMITS
    // =========================
    limits: {
      maxRepositories: {
        type: Number,
        default: 3,
      },

      maxStorageMB: {
        type: Number,
        default: 100,
      },

      maxRepoSizeMB: {
        type: Number,
        default: 50,
      },

      maxFilesPerRepo: {
        type: Number,
        default: 500,
      },

      maxChunksPerRepo: {
        type: Number,
        default: 5000,
      },

      maxMessagesPerRepo: {
        type: Number,
        default: 100,
      },

      // Daily AI analysis limit
      maxAnalysesPerDay: {
        type: Number,
        default: 1,
      },
    },

    // =========================
    // USER USAGE
    // =========================
    usage: {
      analysesToday: {
        type: Number,
        default: 0,
      },

      lastAnalysisDate: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;