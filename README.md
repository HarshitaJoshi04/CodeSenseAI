# CodeSenseAI 🌊

> **A repository-aware AI coding assistant built with Hybrid RAG, structured repository analysis, semantic code search, and grounded LLM responses.**

CodeSenseAI is an intelligent developer assistant that allows users to connect a local codebase or GitHub repository and ask questions about the repository using natural language.

Instead of treating the repository like a collection of unrelated text chunks, CodeSenseAI combines:
- **MongoDB-based structured repository metadata**
- **ChromaDB semantic vector search**
- **LLM-based query intent routing**
- **Exact file retrieval**
- **Programmatic file and folder analysis**
- **Grounded LLM generation**
- **Repository-isolated vector search**
- **Persistent chat sessions and history**

The goal is simple:
> **If the repository contains the answer, CodeSenseAI should retrieve the actual repository information instead of guessing.**

---
##video 


https://github.com/user-attachments/assets/26fd31fc-6e5a-439e-958f-cbbe8fa8a292


## 📌 Table of Contents

- [Overview](#-overview)
- [Why CodeSenseAI?](#-why-codesenseai)
- [Problem Statement](#-problem-statement)
- [Core Idea](#-core-idea)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [System Data Flow](#-system-data-flow)
- [Hybrid RAG Architecture](#-hybrid-rag-architecture)
- [Query Intent Router](#-query-intent-router)
- [Repository Indexing Pipeline](#-repository-indexing-pipeline)
- [Structured Repository Storage](#-structured-repository-storage)
- [Semantic Search Pipeline](#-semantic-search-pipeline)
- [Exact File Retrieval](#-exact-file-retrieval)
- [LLM Grounding](#-llm-grounding)
- [Repository Isolation](#-repository-isolation)
- [Chat History](#-chat-history)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Important Engineering Decisions](#-important-engineering-decisions)
- [Problems Encountered & Solutions](#-problems-encountered--solutions)
- [Running Locally](#-running-locally)
- [Production Deployment](#-production-deployment)
- [Testing & Verification](#-testing--verification)
- [Resume Highlights](#-resume-highlights)
- [Future Improvements](#-future-improvements)
- [Conclusion](#-conclusion)

---

## 🚀 Overview

CodeSenseAI is designed to answer questions about a software repository in a way that is more reliable than a traditional chatbot.

A user can ask questions such as:
* *What is the name of this repository?*
* *How many files are there?*
* *How many JSX files are there?*
* *How many JavaScript files are there?*
* *Where are the JSX files stored?*
* *Is there an index.js file?*
* *Open App.jsx*
* *Explain App.jsx*
* *What is this repository about?*
* *What is the main purpose of this project?*
* *Where is authentication implemented?*
* *How does the application handle login?*

The system does not use the same retrieval strategy for every question. Instead, it determines what kind of question the user is asking and chooses the appropriate retrieval mechanism.

---

## 💡 Why CodeSenseAI?

Traditional RAG (Retrieval-Augmented Generation) systems generally follow this pattern:
```text
Question ──► Embedding ──► Vector Search ──► Top K Chunks ──► LLM ──► Answer
```

This works well for conceptual questions such as:
* *How does authentication work?*
* *Explain the login flow.*

However, vector search is not naturally designed for questions such as:
* *How many files are there?*
* *How many JSX files exist?*
* *Does index.js exist?*
* *What files are inside components?*
* *Open App.jsx.*

These questions require structured or exact retrieval, not semantic similarity. CodeSenseAI therefore uses a Hybrid RAG architecture to route questions to the correct database.

---

## 🧠 Problem Statement

A repository-aware chatbot can easily produce incorrect answers if it relies entirely on semantic retrieval.

For example, suppose a repository contains:
* `src/App.jsx`
* `src/components/Header.jsx`
* `src/components/Footer.jsx`
* `src/components/index.js`

A vector search might retrieve a chunk containing:
```javascript
import Header from "./Header/Header";
```
The LLM may then assume that a corresponding file exists at `src/components/Header/Header.js`, even if the exact repository manifest was not checked.

Similarly, if only five chunks are retrieved, an LLM cannot reliably answer *"How many files are in this repository?"* because the five retrieved chunks do not represent the entire repository. This can cause:
- Incorrect file counts and extension statistics.
- Invented variables, components, and file paths (hallucinated code).
- Contamination between different repositories.
- Previous chatbot mistakes influencing future answers inside the same session history.

CodeSenseAI was designed to solve these problems.

---

## 🎯 Core Idea

The system separates repository questions into different retrieval strategies:

```text
                         USER QUESTION
                              │
                              ▼
                       QUERY ROUTER
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
       STRUCTURED          EXACT            SEMANTIC
        ANALYSIS          RETRIEVAL          SEARCH
             │                │                │
             ▼                ▼                ▼
         MongoDB           MongoDB          ChromaDB
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                       GROUNDED LLM
                              │
                              ▼
                           ANSWER
```

This allows the system to use the right tool for the right question.

---

## ✨ Key Features

1. **Repository Metadata Analysis:** CodeSenseAI programmatically determines repository name, path, total number of files, files by extension, files by language, and files inside folders using database operations.
2. **Exact File Retrieval:** Locates and displays complete file contents directly from MongoDB (e.g. *"show App.jsx"*) rather than relying on a few semantic chunks.
3. **File Existence Checking:** Answers existence questions (e.g. *"Is there an index.js file?"*) directly from the repository's database manifest.
4. **File List Queries:** Lists files (e.g. *"list all JSX files"*, *"files inside components"*) programmatically.
5. **Folder-Aware Counting:** Programs paths filtering to answer questions like *"How many files are inside components?"*.
6. **Typo Tolerance:** Standardizes common user mistakes (e.g. matching `pakage.json` -> `package.json`).
7. **Repository Overview:** Automatically analyzes the main project's `README.md` and `package.json` to generate high-level project descriptions.
8. **Semantic Code Search:** Queries ChromaDB for logic explanations, architectural structures, and search flows.
9. **Grounded Code Explanations:** Prioritizes full target file contents to explain specific components without hallucinations.
10. **Repository Isolation:** Employs unique repository Object IDs (`repoId`) in vector metadata to isolate search results across projects.
11. **Persistent Chat History:** Allows users to return to, edit, or delete previous conversation sessions.

---

## 🏗️ Architecture

CodeSenseAI consists of three primary application layers:

```text
┌─────────────────────────────────────────────┐
│                  FRONTEND                   │
│                                             │
│ React + TailwindCSS + Axios                 │
│                                             │
│ Repository UI | Chat | History | Source     │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTP / REST
                       ▼
┌─────────────────────────────────────────────┐
│                 NODE BACKEND                │
│                                             │
│ Express + MongoDB + Mongoose                │
│                                             │
│ Indexing | Routing | Exact | LLM Orchestrator│
└───────────────┬─────────────────┬───────────┘
                │                 │
                │                 │
                ▼                 ▼
┌───────────────────────┐   ┌─────────────────┐
│       MONGODB         │   │   AI SERVICE    │
│                       │   │                 │
│ Repository metadata   │   │ Python          │
│ File manifest         │   │ FastAPI         │
│ File contents         │   │ ChromaDB        │
│ Chat sessions         │   │ Embeddings      │
└───────────────────────┘   └────────┬────────┘
                                    │
                                    ▼
                              ┌─────────────┐
                              │   CHROMADB  │
                              └─────────────┘
```

---

## 🔄 System Data Flow

### Repository Indexing
```text
User ──► Repository Path ──► Node.js Backend ──► Parser Service
                                                      ├── Discover files (filters node_modules, lockfiles)
                                                      ├── Save files manifest & content ──► MongoDB
                                                      └── Segment into chunks ──► AI Service
                                                                                      ├── Generate Embeddings
                                                                                      └── Save Vectors ──► ChromaDB
```

### Query Flow
```text
User Question ──► Local Query Router ──► Intent Classification
                                                ├─► Structured Query ──► MongoDB ──┐
                                                └─► Semantic Query ──► ChromaDB ───┼─► Context Builder ──► LLM ──► Grounded Answer
```

---

## 🧩 Hybrid RAG Architecture

The system uses three major retrieval mechanisms:

1. **Structured Retrieval (MongoDB):** Programmatically queries the repository manifest to compute metadata statistics like total counts, folder structures, and extension lists.
2. **Exact Retrieval (MongoDB):** Queries the `files` array directly using case-insensitive filename matches to get full file contents.
3. **Semantic Retrieval (ChromaDB):** Embeds the question and searches for relevant vector code chunks inside ChromaDB.

---

## 🧭 Query Intent Router

The router classifies questions into six major categories:
- `METADATA`: Total file counts, repository names, extension counts.
- `EXACT_FILE`: existence check, opening or showing a specific file.
- `FILE_LIST`: Listing files inside folders or with specific extensions.
- `CODE_EXPLANATION`: Code walkthroughs, component walk-throughs, function analysis.
- `REPO_OVERVIEW`: Overall purpose, technologies used, setup details.
- `SEMANTIC_CODE`: Flow logic, algorithm details, connectivity questions.

---

## 📂 Repository Indexing Pipeline

Repository indexing is orchestrated inside `backend/services/repositoryService.js`:
- Clones/accesses the repository.
- Scans files using `backend/services/parserService.js` (supporting `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.json`, `.md`, and ignoring lockfiles/dependencies).
- Stores the authoritative manifest in MongoDB.
- Divides files into chunks of 1000 characters (200 overlap) in `backend/services/chunkService.js`.
- Indexes chunks in the ChromaDB `repository_chunks` collection using Hugging Face `BAAI/bge-small-en-v1.5` embeddings.

---

## 🗄️ Structured Repository Storage

The MongoDB schema (`backend/models/Repository.js`) acts as the source of truth for exact repository facts:
```javascript
const repositorySchema = new mongoose.Schema({
  repoName: { type: String, required: true },
  repoPath: { type: String, required: true },
  files: [{
    fileName: String,
    filePath: String,
    extension: String,
    language: String,
    content: String
  }]
});
```

---

## 🔐 Repository Isolation

To prevent cross-repository search contamination, CodeSenseAI registers each vector chunk in ChromaDB with metadata containing the MongoDB `repoId` Object ID. When a query is made, search parameters filter results strictly matching the active session's `repoId` instead of generic strings like `repoName`.

---

## 🧠 LLM Grounding

To prevent hallucinations, the LLM prompt inside `backend/services/llmService.js` is structured with strict constraints:
- Directs the LLM to only answer based on the provided repository context.
- Forbids inventing variables, functions, components, or paths.
- Explicitly guides the model to distinguish between callback arguments (e.g., `userData` in a `.then()` promise) and React state variables (e.g., `useState`).
- Instructs the LLM to ignore incorrect previous assistant answers in the session history.

---

## 📁 Project Structure

```text
CodeSenseAI/
│
├── ai-service/
│   ├── app.py                     # FastAPI routes (/search, /index)
│   ├── requirements.txt
│   └── services/
│       ├── embedding_service.py   # BGE model configuration
│       └── vector_service.py      # ChromaDB client and queries
│
├── backend/
│   ├── app.js                     # Express server configuration
│   ├── controllers/
│   │   └── chatController.js      # Chat logic, database query handlers, and logs
│   ├── models/
│   │   ├── Repository.js          # MongoDB schema for repository metadata
│   │   ├── ChatSession.js
│   │   └── ChatMessage.js
│   └── services/
│       ├── aiService.js           # ChromaDB HTTP client
│       ├── chunkService.js        # LangChain text splitter
│       ├── llmService.js          # Groq context and chat completion runner
│       ├── localRouterService.js  # Llama-based query intent router
│       └── parserService.js       # File scanner logic
│
└── frontend/
    └── src/
        ├── App.jsx                # Router, state management, page handlers
        └── components/
            ├── ChatHistory.jsx    # Sidebar session list and delete option
            ├── ChatPanel.jsx      # Conversation log and source citation viewer
            ├── HistoryPage.jsx    # Full history manager with delete actions
            └── RepoForm.jsx       # Repository input form
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React | Single-page UI framework |
| | TailwindCSS | Modern responsive styling |
| | Axios | Backend REST API communication |
| **Backend** | Node.js / Express | Server runtime and endpoints |
| | MongoDB / Mongoose | Structured files and session database |
| **AI Service** | Python / FastAPI | Fast API layer for ChromaDB |
| | ChromaDB | High-performance vector database |
| | Sentence Transformers | Embedding engine (`BAAI/bge-small-en-v1.5`) |
| **LLMs** | Groq SDK | Llama 3.1 (Router) & Llama 3.3 (Generation) |

---

## 🧠 Important Engineering Decisions

1. **MongoDB + ChromaDB Division:** Stored statistical and structural data in MongoDB and semantic logic in ChromaDB, optimizing query speed and correctness.
2. **Deterministic Pre-Calculation:** Programmatically calculated counts and file lists rather than asking the LLM to guess.
3. **Full-File Context Explanations:** Fed the full target file content from MongoDB when explaining single files, bypassing vector chunk gaps.
4. **Router-Level Type Sanitation:** Sanitized LLM-returned string literals (e.g. `"null"`, `"undefined"`) into actual JS null values to prevent routing bugs.
5. **Context Retention on Deletion:** Rewrote UI hooks in `App.jsx` to preserve repository metadata when deleting chat sessions, keeping the user in their active directory workspace.

---

## 🔧 Problems Encountered & Solutions

### Problem 1: Incorrect File/Folder Counts
* **Cause:** The system asked the vector database to search for files, which returned arbitrary code chunks.
* **Solution:** Programmed database queries on MongoDB's manifest files to count files and filter folder paths programmatically.

### Problem 2: Code Hallucination & Invented States
* **Cause:** The assistant had access only to parts of files and guessed the rest, confusing callback parameters (like `userData`) with React states.
* **Solution:** Enforced strict system instructions in `llmService.js` and loaded target files in full.

### Problem 3: Cross-Project Contamination
* **Cause:** Multiple repositories using common names (like `my-app`) shared vector database search results.
* **Solution:** Associated ChromaDB vectors with the unique MongoDB `repoId` Object ID.

### Problem 4: Sidebar Disappearing on Session Delete
* **Cause:** Deleting the active chat session cleared all repository context, resetting the entire UI.
* **Solution:** Refactored `handleSelectSession` in `App.jsx` to preserve `repositoryId` and `repoName` when active session ID goes to `null`.

---

## 🚀 Running Locally

### 1. Setup the AI Vector Service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 2. Setup Backend Server
Create a `backend/.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_api_key
AI_SERVICE_URL=http://localhost:8000
```
Run:
```bash
cd backend
npm install
npm run dev
```

### 3. Setup Frontend App
Create a `frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000
```
Run:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 💼 Resume Highlights

* **Hybrid RAG Architecture:** Built a repository-aware coding assistant combining MongoDB structured manifests with ChromaDB vector search to ensure 100% accuracy on statistical calculations and grounded code walk-throughs.
* **Intelligent Query Intent Router:** Designed a classification model using Llama models to dynamically route metadata, exact-file, folder-count, overview, and semantic queries to specialized database pipelines.
* **Metadata Count Grounding:** Replaced vector-search approximations with programmatic database queries for file, extension, and subdirectory statistics, completely eliminating counting hallucinations.
* **Multi-Tenant Vector Isolation:** Implemented repository-level vector isolation using unique MongoDB Object IDs in ChromaDB metadata, avoiding search result contamination across projects.
* **UI Bug Resolution:** Refactored React context hook lifecycles to preserve repository workspaces when deleting chat sessions, stabilizing sidebar history and main layout interfaces.

---

## 🔮 Future Improvements

1. **AST-Based Parser:** Implement Abstract Syntax Tree (AST) parsing to map functions, variables, classes, and imports programmatically.
2. **Interactive Dependency Graph:** Generate interactive visual diagrams showing import relationships and file dependencies.
3. **Response Streaming:** Implement HTTP streaming (`Server-Sent Events`) for progressive LLM token rendering.

---

## 🏁 Conclusion

CodeSenseAI demonstrates that building a robust developer assistant requires more than just connecting an LLM to a vector database. The core engineering challenge lies in creating a system that knows when to count programmatically, when to load code files in full, and when to search semantically.
