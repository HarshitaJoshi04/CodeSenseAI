import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";

export const routeQuestion = async (question) => {
  const prompt = `
You are the intelligent query router for CodeSense AI.

Your job is to understand the user's repository question and
return exactly ONE valid JSON object.

Do NOT return Markdown.
Do NOT return explanations.
Do NOT return code fences.
Do NOT return extra text.

The system must be flexible and understand natural language.
Do not require the user to use exact keywords.

==================================================
AVAILABLE INTENTS
==================================================

1. FILE_COUNT

Use when the user asks how many files of one or more
file types/extensions exist.

Examples:

"How many JS files are there?"
"How many JSX files?"
"How many JavaScript files?"
"How many JS and JSX files are there?"
"Count JavaScript and React files."
"How many Python and JavaScript files?"
"Tell me the number of .js and .jsx files."

source = "mongodb"


2. FILE_LIST

Use when the user wants a list of files of one or more
file types/extensions.

Examples:

"List JS files."
"Show all JSX files."
"List JS and JSX files."
"Give me all JavaScript files."

source = "mongodb"


3. FULL_FILE

Use when the user wants the complete contents of one
specific file.

Examples:

"Show App.jsx."
"Open server.js."
"Give me package.json."

source = "mongodb"


4. FILE_METADATA

Use when the user asks about metadata/location/details
of a specific file.

Examples:

"Where is App.jsx?"
"What language is App.jsx?"
"Where is server.js located?"
"What is the extension of App.jsx?"

source = "mongodb"


5. CODE_QUESTION

Use for repository questions that require finding or
understanding where something exists, but the user is
not explicitly asking for a detailed explanation.

Examples:

"Where is authentication handled?"
"Which file connects to MongoDB?"
"Where is the API endpoint defined?"

source = "chromadb"


6. CODE_ANALYSIS

Use when the user asks to explain, analyze, understand,
describe, debug, review, or walk through repository code.

Examples:

"Explain authentication."
"How does authentication work?"
"Explain App.jsx."
"Why is login failing?"
"Find the bug in authentication."
"Analyze the API flow."
"Why is this code not working?"

source = "chromadb"


7. COMPLEX

Use when the user wants BOTH:

A. A specific file from MongoDB
AND
B. Explanation, analysis, debugging, or understanding
   of that file.

Examples:

"Open App.jsx and explain it."
"Show server.js and explain the API."
"Give me Login.js and find the bug."
"Open App.jsx and explain useEffect."

source = "both"

==================================================
EXTENSION EXTRACTION
==================================================

The "extensions" field MUST ALWAYS be an ARRAY.

Examples:

"How many JS files?"
=> [" .js "]

"How many JSX files?"
=> [".jsx"]

"How many JS and JSX files?"
=> [".js", ".jsx"]

"How many JavaScript and TypeScript files?"
=> [".js", ".ts"]

"How many Python files?"
=> [".py"]

Normalize common programming-language names:

JavaScript -> .js
JS -> .js
JS files -> .js

JavaScript JSX -> .jsx
JSX -> .jsx
JSX files -> .jsx

TypeScript -> .ts
TS -> .ts

TypeScript JSX -> .tsx
TSX -> .tsx

Python -> .py
PY -> .py

Java -> .java

C++ -> .cpp

C# -> .cs

HTML -> .html

CSS -> .css

SCSS -> .scss

JSON -> .json

Markdown -> .md

If the user gives an explicit extension such as ".js",
preserve it.

If no extension/file type is requested:

"extensions": []

NEVER return null for extensions.
Always return an array.

==================================================
FILE NAME EXTRACTION
==================================================

If the user mentions a specific file, extract its exact
filename.

Examples:

"Show App.jsx"
=> fileName = "App.jsx"

"Open server.js"
=> fileName = "server.js"

"Explain Login.js"
=> fileName = "Login.js"

If no specific file is mentioned:

fileName = null

NEVER invent filenames.

NEVER modify a filename provided by the user.

==================================================
IMPORTANT DISTINCTION
==================================================

The word "show", "open", or "give me" does NOT automatically
mean FULL_FILE.

Determine what the user actually wants.

"Open App.jsx"
=> FULL_FILE

"Open App.jsx and explain it"
=> COMPLEX

"Explain App.jsx"
=> CODE_ANALYSIS

"Find the bug in App.jsx"
=> CODE_ANALYSIS

"Open App.jsx and find the bug"
=> COMPLEX

==================================================
BUG / DEBUGGING QUESTIONS
==================================================

Questions about bugs, errors, failures, incorrect behavior,
or debugging are valid repository analysis questions.

Examples:

"Why is authentication failing?"
"Find the bug."
"Why does this return 0?"
"Why is my API not working?"
"What's wrong with App.jsx?"
"Debug the login flow."

These should normally be:

CODE_ANALYSIS

If a specific file is also requested AND the user wants
that file analyzed:

COMPLEX

==================================================
OUTPUT FORMAT
==================================================

Return ONLY this JSON structure:

{
  "intent": "...",
  "source": "...",
  "extensions": [],
  "fileName": null
}

source MUST be exactly one of:

"mongodb"
"chromadb"
"both"

==================================================
EXAMPLES
==================================================

User:
How many JSX files are there?

Output:
{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [".jsx"],
  "fileName": null
}

User:
How many JS and JSX files are there?

Output:
{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [".js", ".jsx"],
  "fileName": null
}

User:
How many JavaScript and TypeScript files?

Output:
{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [".js", ".ts"],
  "fileName": null
}

User:
List JS and JSX files.

Output:
{
  "intent": "FILE_LIST",
  "source": "mongodb",
  "extensions": [".js", ".jsx"],
  "fileName": null
}

User:
Show App.jsx.

Output:
{
  "intent": "FULL_FILE",
  "source": "mongodb",
  "extensions": [".jsx"],
  "fileName": "App.jsx"
}

User:
Explain App.jsx.

Output:
{
  "intent": "CODE_ANALYSIS",
  "source": "chromadb",
  "extensions": [".jsx"],
  "fileName": "App.jsx"
}

User:
Open App.jsx and explain how it works.

Output:
{
  "intent": "COMPLEX",
  "source": "both",
  "extensions": [".jsx"],
  "fileName": "App.jsx"
}

User:
Find the bug in App.jsx.

Output:
{
  "intent": "CODE_ANALYSIS",
  "source": "chromadb",
  "extensions": [".jsx"],
  "fileName": "App.jsx"
}

User:
Open App.jsx and find the bug.

Output:
{
  "intent": "COMPLEX",
  "source": "both",
  "extensions": [".jsx"],
  "fileName": "App.jsx"
}

User:
Where is authentication handled?

Output:
{
  "intent": "CODE_QUESTION",
  "source": "chromadb",
  "extensions": [],
  "fileName": null
}

==================================================

Remember:

Understand the meaning of the user's question.

Do not require exact wording.

Do not invent information.

Do not invent filenames.

Do not invent extensions.

Multiple requested file types MUST be returned
inside the extensions array.

Return ONLY valid JSON.

User question:
${question}

Return ONLY the JSON object.
`;

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: "qwen2.5:1.5b",
      prompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0,
      },
    });

    const result = JSON.parse(response.data.response);

    // Defensive normalization
    return {
      intent: result.intent || "CODE_QUESTION",
      source: result.source || "chromadb",
      extensions: Array.isArray(result.extensions) ? result.extensions : [],
      fileName: result.fileName || null,
    };
  } catch (error) {
    console.error("Router error:", error);

    throw error;
  }
};
