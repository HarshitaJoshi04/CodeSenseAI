import Repository from "../models/Repository.js";

const analysisLimit = async (req, res, next) => {
  console.log("🔥 analysisLimit middleware CALLED");
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Count how many active repositories this user currently has
    const activeRepoCount = await Repository.countDocuments({
      userId: user._id,
    });

    const limit = user.limits.maxRepositories;

    console.log("===== ANALYSIS LIMIT CHECK =====");
    console.log("User:", user.email);
    console.log("Active repos:", activeRepoCount, "/", limit);
    console.log("================================");

    if (activeRepoCount >= limit) {
      return res.status(429).json({
        success: false,
        message:
          "Repository limit reached. Delete an existing repository before analyzing a new one.",
        limit,
        used: activeRepoCount,
      });
    }

    next();
  } catch (error) {
    console.error("Analysis limit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check analysis limit",
    });
  }
};

export { analysisLimit };