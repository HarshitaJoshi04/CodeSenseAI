import fs from "fs";
import path from "path";

const SUPPORTED_EXTENSIONS = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".go",
    ".php",
    ".rb"
];

const IGNORED_DIRECTORIES = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "coverage",
    "__pycache__",
    ".venv"
];

export const getCodeFiles = (repoPath) => {

    const codeFiles = [];

    function scan(currentPath) {

        const items = fs.readdirSync(currentPath);

        for (const item of items) {

            const fullPath = path.join(currentPath, item);

            const stats = fs.statSync(fullPath);

            // Folder
            if (stats.isDirectory()) {

                if (IGNORED_DIRECTORIES.includes(item)) {
                    continue;
                }

                scan(fullPath);
            }

            // File
            else {

                const extension = path.extname(item);

                if (SUPPORTED_EXTENSIONS.includes(extension)) {
                    codeFiles.push(fullPath);
                }

            }

        }

    }

    scan(repoPath);

    return codeFiles;

};