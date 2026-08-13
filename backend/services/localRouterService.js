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
You are the intelligent query router for CodeSense AI.

Your job is to understand the user's CURRENT question using:
1. The current question
2. Previous conversation history
3. The repository context available to the system

You must classify the user's intent and decide which data source
should answer the question.

IMPORTANT:
The user does NOT have to use exact keywords.

Understand natural language, follow-up questions, references,
corrections, comparisons, and conversational context.

The user may say things like:

"how many files are there?"
"what about jsx?"
"and js?"
"you told me there were 4, why?"
"but earlier you said 17"
"are you sure?"
"what did you tell me before?"
"show me those files"
"which ones did you count?"
"then explain App.jsx"

You must understand what the user means from the conversation.

==================================================
AVAILABLE SOURCES
==================================================

SOURCE: mongodb

MongoDB contains the repository's STRUCTURAL / INVENTORY information.

Use MongoDB when the answer depends on the actual repository
file inventory, including:

- total number of files
- number of files by extension
- list of files
- file paths
- exact filenames
- file metadata
- repository structure
- repository information stored in MongoDB

Examples:

"How many files are there?"
"How many JS files?"
"How many JSX files?"
"How many files in total?"
"List every file."
"Show all JavaScript files."
"Which files are in src/components?"
"What files does this repository contain?"

IMPORTANT:

If the user asks for a FILE COUNT or FILE LIST,
the authoritative source is MongoDB.

Do NOT answer file counts from ChromaDB.

Do NOT infer the total number of repository files
from retrieved code snippets.

Do NOT count files mentioned inside code imports.

Do NOT count duplicate retrieval chunks as separate files.

Do NOT guess.

==================================================
SOURCE: chromadb
==================================================

ChromaDB contains indexed repository CODE / CONTENT.

Use ChromaDB when the user asks about:

- how code works
- where functionality is implemented
- relationships between components
- implementation details
- code behavior
- architecture
- debugging
- explaining code
- finding relevant code

Examples:

"How does authentication work?"
"Where is login implemented?"
"Which file connects to MongoDB?"
"How does the API work?"
"Why is authentication failing?"
"Explain the authentication flow."

==================================================
SOURCE: BOTH
==================================================

Use BOTH when the question requires:

A. Repository/file information from MongoDB
AND
B. Code content or analysis from ChromaDB.

Examples:

"Open App.jsx and explain it."
"Show server.js and explain how the API works."
"How many JSX files are there and which ones use useEffect?"
"List the React files and explain which one handles authentication."
"Show App.jsx and find the bug."

MongoDB provides the file/inventory information.

ChromaDB provides the code/content information.

==================================================
INTENTS
==================================================

1==================================================
1. FILE_COUNT — REPOSITORY INVENTORY QUESTIONS
==================================================

Use FILE_COUNT whenever the user's question asks for a
NUMBER, COUNT, TOTAL, SIZE, QUANTITY, or HOW MANY of
repository files, folders, components, or repository
inventory.

The user does NOT need to use the words "count" or "files".

Understand the semantic meaning of the question.

ALL questions whose answer depends on the repository's
actual stored file inventory MUST use:

intent = "FILE_COUNT"
source = "mongodb"

MongoDB is the ONLY authoritative source for these questions.

==================================================
TOTAL REPOSITORY FILE COUNT
==================================================

These ALL mean:

"How many unique files exist in the repository?"

Examples:

"How many files are there?"
"How many files are present?"
"How many files does this repository have?"
"How many files does the repo contain?"
"What's the total number of files?"
"What is the total file count?"
"Give me the total files."
"Tell me the total number of files."
"How big is this repository?"
"How large is this repository?"
"How many files are in this project?"
"How many files are in the repo?"
"How many files exist?"
"How many files are present in the project?"
"Can you count all the files?"
"Count the files."
"Count everything."
"Give me the repository size."
"What is the repository file count?"
"How many source files are there?"
"How many files altogether?"
"How many files in total?"
"Total files?"
"File count?"
"Number of files?"
"How many unique files are there?"

ALL of the above:

{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [],
  "fileName": null
}

==================================================
IMPORTANT: "REPOSITORY SIZE"
==================================================

If the user says:

"How big is the repository?"
"How large is the repo?"
"What's the size of the project?"
"How big is this project?"
"How many files does the project have?"

Interpret "size" as FILE COUNT when the question is
about repository/project structure or inventory.

Do NOT send these questions to ChromaDB.

If the user explicitly asks for disk size in bytes/MB/GB,
that is NOT a file count unless the repository data actually
contains disk-size information.

==================================================
FOLDER / DIRECTORY FILE COUNT
==================================================

If the user asks HOW MANY files are inside a specific
folder, directory, path, or repository section, use:

intent = "FILE_COUNT"
source = "mongodb"

Examples:

"How many files are in src?"
"How many files are inside src?"
"How many files are in the components folder?"
"How many files are inside components?"
"How many files are in src/components?"
"How many files are under src/components?"
"How many files are in the app folder?"
"How many files are in the backend folder?"
"How many files are in frontend?"
"How many files are in the utils directory?"
"Count files in src/components."
"Count the files inside the services folder."
"How many files does src contain?"
"Number of files in components?"
"How many files are present in src/components?"

These MUST be FILE_COUNT.

If a path/folder is explicitly mentioned, extract it.

The output must contain a "path" field.

Example:

User:
"How many files are in src/components?"

Output:

{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [],
  "fileName": null,
  "path": "src/components"
}

If no folder/path is mentioned:

"path": null

==================================================
EXTENSION / LANGUAGE FILE COUNT
==================================================

If the user asks how many files belong to one or more
programming languages or extensions, use FILE_COUNT.

Examples:

"How many JS files?"
"How many JavaScript files?"
"How many JSX files?"
"How many React files?"
"How many TypeScript files?"
"How many TS files?"
"How many TSX files?"
"How many Python files?"
"How many Java files?"
"How many HTML files?"
"How many CSS files?"
"How many JSON files?"
"How many Markdown files?"
"Count JavaScript files."
"Count JSX files."
"Number of Python files?"
"Give me the number of React components."
"How many .js files?"
"How many .jsx files?"

Examples of normalization:

JavaScript / JS / .js
=> [".js"]

JSX / React JSX / .jsx
=> [".jsx"]

TypeScript / TS / .ts
=> [".ts"]

TSX / .tsx
=> [".tsx"]

Python / PY / .py
=> [".py"]

Java / .java
=> [".java"]

C++ / .cpp
=> [".cpp"]

C# / .cs
=> [".cs"]

HTML / .html
=> [".html"]

CSS / .css
=> [".css"]

JSON / .json
=> [".json"]

Markdown / MD / .md
=> [".md"]

==================================================
MULTIPLE FILE TYPES
==================================================

If the user asks about multiple file types, include ALL
requested extensions.

Examples:

"How many JS and JSX files?"
=> [".js", ".jsx"]

"How many JavaScript, TypeScript and Python files?"
=> [".js", ".ts", ".py"]

"How many HTML, CSS and JS files?"
=> [".html", ".css", ".js"]

Never drop one of the requested types.

==================================================
COMPONENT COUNT
==================================================

Questions asking HOW MANY components exist are also
repository inventory questions when the repository
components can be determined from stored file information.

Examples:

"How many components are there?"
"How many React components are there?"
"How many components does this project have?"
"How many components are in the repository?"
"How many components are in src/components?"
"How many JSX components are there?"
"Count the components."
"Total number of components?"
"How many React components?"

Route these to:

intent = "FILE_COUNT"
source = "mongodb"

For React/JSX component counts, use the repository's
stored file inventory rather than counting component names
mentioned inside ChromaDB chunks.

If the system cannot determine component count from the
available MongoDB inventory, it must NOT invent a number.

==================================================
SOURCE FOLDER / DIRECTORY / PATH COUNTS
==================================================

The following are FILE_COUNT questions:

"How many files are in source?"
"How many files are in src?"
"How many files are in components?"
"How many files are in src/components?"
"How many files are in backend?"
"How many files are in frontend?"
"How many files are under services?"
"How many files are inside controllers?"
"How many files are in the models directory?"

Always use MongoDB.

==================================================
SEMANTIC VARIATIONS
==================================================

Treat all of these as equivalent counting language:

"how many"
"number of"
"count"
"total"
"total number"
"how much"
"quantity"
"amount"
"give me the count"
"tell me the count"
"what is the count"
"what's the count"
"how many are there"
"how many exist"
"how many present"
"how many available"
"how many does it have"
"how many does the repo contain"

Do NOT depend on exact keywords.

Understand the user's meaning.

==================================================
CONVERSATIONAL FILE COUNT
==================================================

Use conversation history to resolve incomplete questions.

Example:

User:
"How many JSX files are there?"

Assistant:
"There are 8 JSX files."

User:
"What about JS?"

Interpret:

"How many JS files are there?"

Return:

{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [".js"],
  "fileName": null,
  "path": null
}

--------------------------------------------------

User:
"How many files are there?"

Assistant:
"There are 17 files."

User:
"What about src?"

Interpret:

"How many files are in src?"

Return:

{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [],
  "fileName": null,
  "path": "src"
}

--------------------------------------------------

User:
"How many files are in components?"

User:
"What about JSX?"

Interpret:

"How many JSX files are in components?"

Return:

{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [".jsx"],
  "fileName": null,
  "path": "components"
}

==================================================
COUNTING MUST NEVER USE CHROMADB
==================================================

NEVER calculate a repository file count by:

- counting ChromaDB chunks
- counting retrieved documents
- counting metadata entries
- counting source entries
- counting imports
- counting filenames mentioned in code
- counting files mentioned by an LLM
- counting files visible in the current context
- counting duplicate chunks
- counting duplicate file references
- guessing from semantic search results

For FILE_COUNT:

MongoDB repository.files = source of truth.

==================================================
DUPLICATE HANDLING
==================================================

A file must be counted ONLY ONCE.

For example, if ChromaDB returns:

src/App.jsx chunk 0
src/App.jsx chunk 1
src/App.jsx chunk 2

that is ONE file, not three files.

Similarly, if the same file appears multiple times in
retrieved context, it must still count as ONE file.

==================================================
IMPORTANT DISTINCTION
==================================================

"How many files are there?"

=> FILE_COUNT

"List all files."

=> FILE_LIST

"Which files are in src?"

=> FILE_LIST

"How many files are in src?"

=> FILE_COUNT

"Explain the files in src."

=> CODE_ANALYSIS or COMPLEX depending on whether
exact file inventory is required.

"How many JSX files are there and explain App.jsx?"

=> COMPLEX

==================================================
DEFAULT RULE
==================================================

If the user's primary intent is to determine a NUMBER
of repository files or repository inventory items,
prefer FILE_COUNT.

When uncertain between FILE_COUNT and CODE_QUESTION,
and the user is asking for a numerical repository inventory,
choose FILE_COUNT.

When uncertain between FILE_COUNT and FILE_LIST:

- NUMBER / COUNT / HOW MANY => FILE_COUNT
- NAMES / WHICH FILES / LIST => FILE_LIST

When uncertain between FILE_COUNT and CODE_ANALYSIS:

- NUMBER / COUNT => FILE_COUNT
- EXPLAIN / WHY / HOW IT WORKS => CODE_ANALYSIS

When BOTH exact repository inventory AND semantic code
analysis are required:

=> COMPLEX

==================================================
3. FULL_FILE
==================================================

Use when the user wants the complete contents of one specific file.

Examples:

"Open App.jsx"
"Show App.jsx"
"Give me package.json"
"Show server.js"

source = "mongodb"

fileName must contain the exact filename.

==================================================
4. FILE_METADATA
==================================================

Use when asking about metadata/location/details of a file.

Examples:

"Where is App.jsx?"
"What folder is App.jsx in?"
"What extension does App.jsx have?"
"Where is server.js located?"

source = "mongodb"

==================================================
5. CODE_QUESTION
==================================================

Use when the user asks where or how something is implemented
but does not require a full detailed explanation.

Examples:

"Where is authentication handled?"
"Which file connects to MongoDB?"
"Where is the API endpoint?"
"Which component handles login?"

source = "chromadb"

==================================================
6. CODE_ANALYSIS
==================================================

Use for:

- explain
- analyze
- understand
- debug
- review
- why
- how does it work
- find the bug
- what's wrong
- walk me through

Examples:

"Explain App.jsx."
"How does authentication work?"
"Why is login failing?"
"Find the bug in authentication."
"Analyze the API flow."
"Why does this function return null?"

source = "chromadb"

==================================================
7. COMPLEX
==================================================

Use when the user needs BOTH repository file information
AND code analysis/content.

Examples:

"Open App.jsx and explain it."
"Show server.js and explain the API."
"Open Login.jsx and find the bug."
"List the React files and explain their roles."

source = "both"

==================================================
CONVERSATIONAL FOLLOW-UP INTELLIGENCE
==================================================

This is extremely important.

The user may ask follow-up questions that are incomplete
when considered alone.

You MUST use previous conversation history.

For example:

User:
"How many files are there?"

Assistant:
"There are 17 files."

User:
"Are you sure?"

This is NOT a new generic question.

It refers to the previous file count.

Classify it as:

{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [],
  "fileName": null
}

Another example:

User:
"How many JSX files?"

Assistant:
"There are 8 JSX files."

User:
"What about JS?"

Interpret "JS" as the missing extension.

Return:

{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [".js"],
  "fileName": null
}

Another example:

User:
"How many files are there?"

Assistant:
"There are 17 files."

User:
"But you told me there were 4."

This is a conversational challenge/correction.

The user is asking about a previous repository file count.

Route it to MongoDB so the system can retrieve the authoritative
repository inventory and reconcile the previous answer.

Return:

{
  "intent": "FILE_COUNT",
  "source": "mongodb",
  "extensions": [],
  "fileName": null
}

Another example:

User:
"Show App.jsx."

Assistant:
[App.jsx]

User:
"Explain this."

"This" refers to App.jsx.

Return:

{
  "intent": "CODE_ANALYSIS",
  "source": "chromadb",
  "extensions": [".jsx"],
  "fileName": "App.jsx"
}

Another:

User:
"How many JSX files?"

User:
"List them."

"them" refers to JSX files.

Return:

{
  "intent": "FILE_LIST",
  "source": "mongodb",
  "extensions": [".jsx"],
  "fileName": null
}

Another:

User:
"How many files?"

User:
"Which ones did you count?"

This refers to the previous total file count.

Return:

{
  "intent": "FILE_LIST",
  "source": "mongodb",
  "extensions": [],
  "fileName": null
}

==================================================
CORRECTION / CONTRADICTION HANDLING
==================================================

The user may challenge a previous answer.

Examples:

"you are wrong"
"that's not correct"
"but you told me 4"
"earlier you said 17"
"why did you say 4?"
"are you sure?"
"you counted incorrectly"
"that doesn't look right"

Do NOT blindly repeat the previous answer.

Do NOT treat the previous assistant answer as authoritative.

Instead, route the question to the source that can verify it.

For repository file counts:

source = "mongodb"

For code behavior:

source = "chromadb"

For questions requiring both:

source = "both"

The previous assistant answer is conversational context,
NOT repository truth.

MongoDB repository inventory is the source of truth for
file counts and file lists.

==================================================
FILE EXTENSION NORMALIZATION
==================================================

Always return extensions as an ARRAY.

Never return null.

JavaScript -> [".js"]
JS -> [".js"]

JSX -> [".jsx"]
React JSX -> [".jsx"]

TypeScript -> [".ts"]
TS -> [".ts"]

TSX -> [".tsx"]

Python -> [".py"]
PY -> [".py"]

Java -> [".java"]

C++ -> [".cpp"]

C# -> [".cs"]

HTML -> [".html"]

CSS -> [".css"]

SCSS -> [".scss"]

JSON -> [".json"]

Markdown -> [".md"]

If the user explicitly provides an extension such as ".js",
preserve it.

If no extension/type is requested:

extensions = []

==================================================
MULTIPLE EXTENSIONS
==================================================

If multiple file types are requested, include ALL of them.

"How many JS and JSX files?"

[
  ".js",
  ".jsx"
]

"How many JavaScript, TypeScript and Python files?"

[
  ".js",
  ".ts",
  ".py"
]

==================================================
FILE NAME EXTRACTION
==================================================

If the user mentions a specific file, extract its exact filename.

"Show App.jsx"
=> "App.jsx"

"Explain Login.js"
=> "Login.js"

"Open package.json"
=> "package.json"

Never invent a filename.

Never modify the filename.

If no specific file is mentioned:

fileName = null

==================================================
IMPORTANT DISTINCTION
==================================================

Do NOT assume:

"show" = FULL_FILE

Determine what the user actually means.

"Show App.jsx"
=> FULL_FILE

"Show App.jsx and explain it"
=> COMPLEX

"Explain App.jsx"
=> CODE_ANALYSIS

"Find the bug in App.jsx"
=> CODE_ANALYSIS

"Open App.jsx and find the bug"
=> COMPLEX

"How many files are there?"
=> FILE_COUNT

"List the files"
=> FILE_LIST

==================================================
TOTAL FILE COUNT RULE
==================================================

When the user asks:

"How many files are there?"

interpret it as:

"How many unique files exist in the repository?"

NOT:

"How many files appeared in the retrieved context?"

NOT:

"How many files were mentioned by imports?"

NOT:

"How many ChromaDB chunks were retrieved?"

NOT:

"How many code snippets are visible?"

The actual count must come from MongoDB's repository file inventory.

==================================================
OUTPUT
==================================================

Return ONLY this JSON object:

{
  "intent": "...",
  "source": "...",
  "extensions": [],
  "fileName": null
}

intent MUST be exactly one of:

"FILE_COUNT"
"FILE_LIST"
"FULL_FILE"
"FILE_METADATA"
"CODE_QUESTION"
"CODE_ANALYSIS"
"COMPLEX"

source MUST be exactly one of:

"mongodb"
"chromadb"
"both"

extensions MUST ALWAYS be an array.

fileName MUST be either a string or null.

Do NOT return Markdown.

Do NOT return explanations.

Do NOT return code fences.

Do NOT return extra text.

==================================================
CONVERSATION HISTORY
==================================================

Previous conversation:

${conversationContext || "No previous conversation."}

==================================================
CURRENT USER QUESTION
==================================================

${question}

Classify the CURRENT question using the previous conversation
when necessary.

Return ONLY the JSON object.
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
      "FILE_COUNT",
      "FILE_LIST",
      "FULL_FILE",
      "FILE_METADATA",
      "CODE_QUESTION",
      "CODE_ANALYSIS",
      "COMPLEX",
    ];

    const validSources = [
      "mongodb",
      "chromadb",
      "both",
    ];

    return {
      intent: validIntents.includes(cleanedIntent)
        ? cleanedIntent
        : "CODE_QUESTION",

      source: validSources.includes(cleanedSource)
        ? cleanedSource
        : "chromadb",

      extensions: Array.isArray(result.extensions)
        ? result.extensions
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