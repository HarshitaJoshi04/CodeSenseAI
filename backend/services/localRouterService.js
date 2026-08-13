import groq from "./groqClient.js";

export const routeQuestion = async (question, history = []) => {
  const conversationContext = history
    .slice(-10)
    .map((msg) => {
      const role = msg.role || "user";
      const content =
        msg.content ||
        msg.answer ||
        msg.explanation ||
        "";
      return `${role.toUpperCase()}: ${content}`;
    })
    .join("\n");

  const prompt = `
You are the query router for CodeSense AI.
Your job is to categorize the user's question and determine the intent, data source, file name, folder path, and extensions. Use the conversation history to resolve pronouns ("it", "this file", "they") and follow-up questions.

CLASSIFICATION RULES:

1. METADATA
- User asks about repository attributes: repository name, file count, folder/path file count, extension count, list of file extensions used, languages used.
- Examples: "how many files?", "how many js files are there?", "what is the name of this repository?", "what extensions are used?", "how many files are there in components folder"
- source: "mongodb"
- intent: "METADATA"

2. EXACT_FILE
- User asks about the existence, path, or raw content of one specific file.
- Examples: "is there an index.js file?", "where is App.jsx?", "show App.jsx", "open App.jsx", "what is inside index.js?"
- source: "mongodb"
- intent: "EXACT_FILE"

3. FILE_LIST
- User asks for a list/names of files (optionally filtered by extension or folder path).
- Examples: "name all js files", "list jsx files", "show all files under src/pages", "which files are in components?"
- source: "mongodb"
- intent: "FILE_LIST"

4. CODE_EXPLANATION
- User asks to explain, analyze, walkthrough, debug, or ask specific questions about the code, state, variables, imports, or behavior of a specific file or component.
- Examples: "explain App.jsx", "does App.jsx contain a userData state?", "what functions are exported by auth.js", "walk me through the authentication flow in auth.js"
- source: "both"
- intent: "CODE_EXPLANATION"

5. REPO_OVERVIEW
- User asks what the repository is about, what technologies are used, or for a general overview of the project.
- Examples: "what is this repo about?", "explain this project", "what technologies are used?", "what is the project structure?"
- source: "mongodb"
- intent: "REPO_OVERVIEW"

6. SEMANTIC_CODE
- User asks about how something works, where functionality is implemented, or general code questions without targeting a specific file.
- Examples: "where is authentication implemented?", "how does login work?", "where is Redux configured?"
- source: "chromadb"
- intent: "SEMANTIC_CODE"

OUTPUT FORMAT:
Return ONLY this JSON object. Do not include markdown formatting or extra text:
{
  "intent": "METADATA" | "EXACT_FILE" | "FILE_LIST" | "CODE_EXPLANATION" | "REPO_OVERVIEW" | "SEMANTIC_CODE",
  "source": "mongodb" | "chromadb" | "both",
  "extensions": [".js", ".jsx", etc. if mentioned, otherwise []],
  "fileName": "filename if a specific file is mentioned, otherwise null",
  "path": "folder path (e.g. 'src/components' or 'components') if mentioned, otherwise null"
}

==================================================
CONVERSATION HISTORY
==================================================
${conversationContext || "No previous conversation."}

==================================================
CURRENT USER QUESTION
==================================================
${question}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: 0,
      response_format: {
        type: "json_object",
      },
    });

    const result = JSON.parse(
      response.choices[0].message.content
    );

    // Normalize intent to UPPERCASE and source to lowercase
    const cleanedIntent = typeof result.intent === "string" ? result.intent.toUpperCase() : "";
    const cleanedSource = typeof result.source === "string" ? result.source.toLowerCase() : "";

    const validIntents = [
      "METADATA",
      "EXACT_FILE",
      "FILE_LIST",
      "CODE_EXPLANATION",
      "REPO_OVERVIEW",
      "SEMANTIC_CODE",
    ];

    const validSources = [
      "mongodb",
      "chromadb",
      "both",
    ];

    return {
      intent: validIntents.includes(cleanedIntent)
        ? cleanedIntent
        : "SEMANTIC_CODE",

      source: validSources.includes(cleanedSource)
        ? cleanedSource
        : "chromadb",

      extensions: Array.isArray(result.extensions)
        ? result.extensions.map(ext => ext.startsWith(".") ? ext : `.${ext}`)
        : [],

      fileName:
        typeof result.fileName === "string"
          ? result.fileName
          : null,

      path:
        typeof result.path === "string"
          ? result.path
          : null,
    };

  } catch (error) {
    console.error("Router error:", error);
    throw error;
  }
};