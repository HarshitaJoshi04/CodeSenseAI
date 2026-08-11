import { indexRepository } from "../services/repositoryService.js";

export const processRepository = async (req, res) => {
    try {

        const { repoUrl } = req.body;

        if (!repoUrl) {
            return res.status(400).json({
                success: false,
                message: "Repository URL is required",
            });
        }

        const result = await indexRepository(repoUrl);

        res.json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Repository processing error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};