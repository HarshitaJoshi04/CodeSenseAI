import fs from "fs";
import path from "path";

import { cloneRepo } from "./githubService.js";
import { getCodeFiles } from "./parserService.js";
import { chunkFile } from "./chunkService.js";
import { storeChunk } from "./aiService.js";

import Repository from "../models/Repository.js";

export const indexRepository = async (repoUrl) => {

    // 1. Clone repository
    const repository = await cloneRepo(repoUrl);

    console.log("Repository:", repository.repoPath);

    // 2. Find all supported code files
    const files = getCodeFiles(repository.repoPath);

    console.log("TOTAL CODE FILES:", files.length);

    // 3. Prepare file data
    const fileData = files.map((file) => {

        const extension = path.extname(file);

        const content = fs.readFileSync(
            file,
            "utf-8"
        );

        return {
            fileName: path.basename(file),
            filePath: path.relative(
                repository.repoPath,
                file
            ),
            extension,
            language: extension.replace(".", ""),
            content,
        };
    });

    // 4. Save repository + complete files in MongoDB
const savedRepository = await Repository.findOneAndUpdate(
    {
        repoName: repository.repoName,
    },
    {
        repoName: repository.repoName,
        repoPath: repository.repoPath,
        files: fileData,
    },
    {
        upsert: true,
        new: true,
    }
);

    console.log(
        `Repository ${repository.repoName} saved with ${fileData.length} files`
    );

    // 5. Store chunks in ChromaDB
    let totalChunks = 0;

    for (const file of files) {

        const chunks = await chunkFile(
            file,
            repository.repoName,
            repository.repoPath
        );

        console.log(
            `${file} → ${chunks.length} chunks`
        );

        for (let i = 0; i < chunks.length; i++) {
            // Get unique file path key (e.g. src_components_Button_jsx)
            const safeFilePath = chunks[i].metadata.filePath.replace(/[\/\\]/g, "_");

            await storeChunk({
                id: `${repository.repoName}_${safeFilePath}_${i}`,

                text: chunks[i].pageContent,

                metadata: {
                    ...chunks[i].metadata,
                    repoName: repository.repoName,
                },
            });

            totalChunks++;
        }
    }

    console.log(
        `TOTAL CHUNKS STORED: ${totalChunks}`
    );

    return {
            repositoryId: savedRepository._id,
        repoName: repository.repoName,
        files: files.length,
        chunks: totalChunks,
    };
};