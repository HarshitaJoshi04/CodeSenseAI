import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";

export const routeQuestion = async (question) => {

const prompt = `
You are the routing system for CodeSense AI.

Your ONLY job is to understand the user's question and classify it.

You MUST return exactly ONE valid JSON object.
Do NOT explain your answer.

========================
AVAILABLE INTENTS
========================

FILE_COUNT
Use when the user asks how many files of a particular type exist.

FILE_LIST
Use when the user asks to list files of a particular type.

FULL_FILE
Use when the user wants the complete contents of a specific file.

FILE_METADATA
Use when the user asks about a file's path, language, extension, or other metadata.

CODE_QUESTION
Use when the user asks a general question about code or repository behavior.

CODE_ANALYSIS
Use when the user wants an explanation of how some code, feature, or functionality works.

COMPLEX
Use when the question requires BOTH exact file information AND semantic code understanding.

========================
AVAILABLE SOURCES
========================

The "source" field MUST be EXACTLY ONE of:

"mongodb"
"chromadb"
"both"

NEVER return:
"mongodb | chromadb | both"

Routing rules:

FILE_COUNT → mongodb
FILE_LIST → mongodb
FULL_FILE → mongodb
FILE_METADATA → mongodb
CODE_QUESTION → chromadb
CODE_ANALYSIS → chromadb
COMPLEX → both

========================
IMPORTANT
========================

If the user mentions a file extension, extract it.

Examples:

"how many JSX files are there?"
→ extension = ".jsx"

"how many Python files?"
→ extension = ".py"

If the user mentions a specific file, extract its filename.

Examples:

"show me App.jsx"
→ fileName = "App.jsx"

"give me the complete Login.js file"
→ fileName = "Login.js"

If something is not present, use null.

========================
EXAMPLES
========================

User:
how many JSX files are there?

Output:
{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extension": ".jsx",
  "fileName": null
}

User:
list all JSX files

Output:
{
  "intent": "FILE_LIST",
  "source": "mongodb",
  "extension": ".jsx",
  "fileName": null
}

User:
show me App.jsx

Output:
{
  "intent": "FULL_FILE",
  "source": "mongodb",
  "extension": ".jsx",
  "fileName": "App.jsx"
}

User:
where is App.jsx located?

Output:
{
  "intent": "FILE_METADATA",
  "source": "mongodb",
  "extension": ".jsx",
  "fileName": "App.jsx"
}

User:
where is authentication handled?

Output:
{
  "intent": "CODE_QUESTION",
  "source": "chromadb",
  "extension": null,
  "fileName": null
}

User:
explain how authentication works

Output:
{
  "intent": "CODE_ANALYSIS",
  "source": "chromadb",
  "extension": null,
  "fileName": null
}

User:
show me App.jsx and explain how it works

Output:
{
  "intent": "COMPLEX",
  "source": "both",
  "extension": ".jsx",
  "fileName": "App.jsx"
}

========================
USER QUESTION
========================

${question}

Return ONLY the JSON object.
`;


    const response = await axios.post(
        OLLAMA_URL,
        {
            model: "qwen2.5:1.5b",

            prompt,

            stream: false,

            format: "json",

            options: {
                temperature: 0
            }
        }
    );


    const result = JSON.parse(
        response.data.response
    );


    return result;
};