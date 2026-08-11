import Repository from "../models/Repository.js";

export const getFilesByExtension = async (repoName, extension) => {

    const repository = await Repository.findOne({ repoName });

    if (!repository) {
        return [];
    }

    return repository.files.filter(
        (file) =>
            file.extension.toLowerCase() === extension.toLowerCase()
    );
};


export const getRepositoryFiles = async (repoName) => {

    const repository = await Repository.findOne({ repoName });

    if (!repository) {
        return [];
    }

    return repository.files;
};


export const getFullFile = async (repoName, fileName) => {

    const repository = await Repository.findOne({ repoName });

    if (!repository) {
        return null;
    }

    const file = repository.files.find(
        (file) =>
            file.fileName.toLowerCase() === fileName.toLowerCase()
    );

    return file || null;
};