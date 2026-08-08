import simpleGit from "simple-git";
import fs from "fs";
import path from "path";

const git = simpleGit();

export const cloneRepo = async (repoUrl) => {
  // Extract repository name
  const repoName = repoUrl.split("/").pop().replace(".git", "");

  const reposDir = "repos";

  if (!fs.existsSync(reposDir)) {
    fs.mkdirSync(reposDir, { recursive: true });
  }
  // repos/react
  const repoPath = path.join("repos", repoName);

  // Repository already exists
  if (fs.existsSync(repoPath)) {
    // Open existing repository
    const repoGit = simpleGit(repoPath);

    // Fetch latest commits
    await repoGit.fetch();

    // Pull latest changes
    await repoGit.pull();

    return {
      message: "Repository updated successfully",
      repoName,
      repoPath,
    };
  }

  // Clone repository for the first time
  await git.clone(repoUrl, repoPath);

  return {
    message: "Repository cloned successfully",
    repoName,
    repoPath,
  };
};
