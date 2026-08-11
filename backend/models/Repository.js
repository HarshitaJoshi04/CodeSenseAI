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
        repoName: {
            type: String,
            required: true,
            unique: true,
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

const Repository = mongoose.model(
    "Repository",
    repositorySchema
);

export default Repository;