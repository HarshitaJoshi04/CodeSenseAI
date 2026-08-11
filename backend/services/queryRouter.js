export const detectQueryType = (question) => {

    const q = question.toLowerCase().trim();

    const isFileCountQuestion =
        (
            q.includes("how many") ||
            q.includes("count") ||
            q.includes("number of") ||
            q.includes("total") ||
            q.includes("how much")
        ) &&
        (
            q.includes("file") ||
            q.includes("files")
        );

    if (isFileCountQuestion) {
        return "FILE_COUNT";
    }


    const isFileListQuestion =
        (
            q.includes("list") ||
            q.includes("which") ||
            q.includes("what are")
        ) &&
        (
            q.includes("file") ||
            q.includes("files")
        );

    if (isFileListQuestion) {
        return "FILE_LIST";
    }


    const isFullFileQuestion =
        q.includes("show") ||
        q.includes("give me") ||
        q.includes("display") ||
        q.includes("open") ||
        q.includes("entire file") ||
        q.includes("full file");

    if (isFullFileQuestion) {
        return "FULL_FILE";
    }


    return "CODE_QUESTION";
};