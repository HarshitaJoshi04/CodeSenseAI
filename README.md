# CodeSenseAI 🌊

**CodeSenseAI** is an intelligent, repository-aware coding assistant. It allows you to analyze local codebase folders or GitHub repositories and ask questions about them in plain English. 

Unlike basic chatbot systems that only guess answers using keyword matching, CodeSenseAI uses a **Hybrid Retrieval-Augmented Generation (RAG)** architecture. It accurately counts files, finds specific functions, checks if a file exists, and explains complex logic without making mistakes or "hallucinating" code that isn't there.

---

## 💡 The Problem & The Solution

### The Problem with Normal AI Chatbots
Most coding assistants use a vector database (like ChromaDB) to search for code snippets. This works well for general questions like *"Explain how this function works"*. However, it completely fails for structured questions like:
* *"How many Javascript files are there in this project?"*
* *"Does `App.jsx` contain a variable named `userData`?"*
* *"Where is `index.js` located?"*

Because vector databases only look at semantic meaning, the AI is forced to guess numbers and invent variables, leading to incorrect answers.

### The CodeSenseAI Solution
We built a **Smart Query Router** that reads the user's question first and chooses the best way to get the answer:
1. **Repository Metadata & Counting:** Programmatic database calculations directly on a MongoDB file manifest (100% accurate file counts, extension counts, and folder scans).
2. **Exact File Retrieval:** Direct lookup of full file content from MongoDB using case-insensitive matching and typo tolerance (e.g. matching `pakage.json` -> `package.json`).
3. **Semantic Code Search:** ChromaDB vector database queries for high-level logic, algorithm explanations, and code summaries.

---

## 🛠️ Tech Stack

* **Frontend:** React, TailwindCSS, Axios (Clean, responsive, real-time chat interface).
* **Backend:** Node.js, Express, MongoDB (Mongoose) (Handles repository indexing, chat sessions, and history).
* **AI & Vector Service:** Python, FastAPI, ChromaDB (Stores code chunks and executes high-speed semantic searches).
* **LLM Integrations:** Groq SDK (Llama 3.1 for high-speed query routing, Llama 3.3 for grounded code explanations).
* **Embeddings:** Hugging Face `BAAI/bge-small-en-v1.5` (Converts code text into vectors).

---

## 🏗️ System Architecture & Data Flow

1. **Indexing Phase:**
   * The user inputs a repository folder path.
   * A filesystem parser recursively reads files, ignores dependencies (like `node_modules` and lockfiles), and stores the file manifest in MongoDB.
   * LangChain splitters divide code files into small chunks, and the Python service indexes them into ChromaDB.
2. **Query Phase:**
   * The user asks a question.
   * The **LLM Router** classifies the intent (`METADATA`, `EXACT_FILE`, `FILE_LIST`, `CODE_EXPLANATION`, `REPO_OVERVIEW`, or `SEMANTIC_CODE`).
   * The backend fetches exact context from MongoDB or semantic chunks from ChromaDB.
   * The LLM generates a grounded response restricted only to verified codebase facts.

---

## 🚀 How to Run Locally

### Prerequisites
* [Node.js](https://nodejs.org/) installed
* [Python 3.10+](https://www.python.org/) installed
* [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI

### 1. Setup the Vector AI Service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate # On Linux use: source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 2. Setup Backend Server
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_api_key
AI_SERVICE_URL=http://localhost:8000
```
Then run:
```bash
cd backend
npm install
npm run dev
```

### 3. Setup Frontend App
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000
```
Then run:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser!

---

## 📈 Resume Highlights (Key Achievements)

If you are putting CodeSenseAI on your resume, highlight these accomplishments:
* **Built a Hybrid RAG System:** Combined structured database schemas (MongoDB) and unstructured vector search (ChromaDB) to achieve 100% accuracy on folder counts, extension lists, and exact file requests.
* **Designed a Query Intent Router:** Leveraged Llama models to analyze user questions in real-time, directing traffic to programmatic counters or semantic indexers.
* **Optimized File Indexing Pipeline:** Wrote a recursive filesystem parser that extracts source code, discards bloated configuration files, and splits code segments to improve context relevance.
* **Secured Vector Search Isolation:** Implemented repository isolation tags inside ChromaDB collections, preventing search results from mixing when indexing multiple projects.
* **Fixed UI State Handling:** Debugged front-end component cycles to ensure active repository selections remain visible when chat histories are updated or deleted.
