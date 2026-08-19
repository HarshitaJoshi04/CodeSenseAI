import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true,
        },

        filePath: {
            type: String,
            required: true,
        },

        extension: {
            type: String,
            required: true,
        },

        language: {
            type: String,
            required: true,
        },

        content: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
    }
);

const repositorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        repoName: {
            type: String,
            required: true,
        },

        repoPath: {
            type: String,
            required: true,
        },

        files: {
            type: [fileSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

repositorySchema.index(
    { userId: 1, repoName: 1 },
    { unique: true }
);

const Repository = mongoose.model(
    "Repository",
    repositorySchema
);

export default Repository;