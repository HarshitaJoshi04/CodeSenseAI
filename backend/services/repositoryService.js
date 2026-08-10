import path from "path";

import { cloneRepo } from "./githubService.js";
import { getCodeFiles } from "./parserService.js";
import { chunkFile } from "./chunkService.js";
import { storeChunk } from "./aiService.js";

export const indexRepository = async (repoUrl) => {

    const repository = await cloneRepo(repoUrl);

    const files = getCodeFiles(repository.repoPath);

    for (const file of files) {

        const chunks = await chunkFile(file);

        const fileName = path.basename(file);

        for (let i = 0; i < chunks.length; i++) {

            await storeChunk({

                id: `${repository.repoName}_${fileName}_${i}`,

                text: chunks[i].pageContent,

                metadata: {
                    ...chunks[i].metadata,
                    repoName: repository.repoName,
                }

            });

        }
    }
};