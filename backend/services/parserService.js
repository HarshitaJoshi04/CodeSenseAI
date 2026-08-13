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

                scan(fullPath);//this function keeops going deeper and deeper to scal=n files and pages;
            }

            // File
            else {
                const extension = path.extname(item);
                const lowerItem = item.toLowerCase();

                if (lowerItem === "package-lock.json" || lowerItem === "yarn.lock" || lowerItem === "pnpm-lock.yaml") {
                    continue;
                }

                if (SUPPORTED_EXTENSIONS.includes(extension) || lowerItem === "package.json" || lowerItem === "readme.md") {
                    codeFiles.push(fullPath);
                }
            }

        }

    }

    scan(repoPath);

    return codeFiles;

};