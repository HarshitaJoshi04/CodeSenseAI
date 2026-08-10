
import { cloneRepo } from "../services/githubService.js";
import { getCodeFiles } from "../services/parserService.js";
import { chunkFile } from "../services/chunkService.js";
import { storeChunk } from "../services/aiService.js";

export const processRepository = async (req, res) => {

    try {

        const { repoUrl } = req.body;

        // 1. Clone repository
        const repository = await cloneRepo(repoUrl);

        console.log("Repository:", repository.repoPath);

        // 2. Find code files
        const files = getCodeFiles(repository.repoPath);

        console.log("Total Files:", files.length);

        let totalChunks = 0;

        // 3. Process every file
        for (const file of files) {

            const chunks = await chunkFile(
    file,
    repository.repoName,
    repository.repoPath
);

            console.log(
                `${file} → ${chunks.length} chunks`
            );

            // 4. Store every chunk
            for (let i = 0; i < chunks.length; i++) {
                console.log("CHUNK METADATA:", chunks[i].metadata);
                await storeChunk({

                    id: `${repository.repoName}_${i}_${totalChunks}`,

                    text: chunks[i].pageContent,

                    metadata: chunks[i].metadata

                });

                totalChunks++;
            }
        }

        res.json({
            success: true,
            repoName: repository.repoName,
            files: files.length,
            chunks: totalChunks
        });

    } catch (error) {

        console.error(
            "Repository processing error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};

