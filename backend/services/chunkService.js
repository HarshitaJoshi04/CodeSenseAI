import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
});

export const chunkFile = async (filePath, repoName, repoPath) => {
    const content = fs.readFileSync(filePath, "utf-8");

    const chunks = await splitter.createDocuments([content]);

    chunks.forEach((chunk, index) => {

        chunk.metadata = {
            fileName: path.basename(filePath),

            filePath: path.relative(repoPath, filePath),

            chunkIndex: index,

            language: "javascript",

            repoName: repoName
        };

    });

    return chunks;
};