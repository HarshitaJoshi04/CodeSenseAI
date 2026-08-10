from fastapi import FastAPI
from services.vector_service import store_chunk
from services.vector_service import search_chunks
app = FastAPI(title="CodeSense AI Service") #This creates your FastAPI application.

@app.get("/")
def home():
    return {
        "message": "AI Service Running"
    }

@app.post("/store")
def store(request: dict): #request contains the JSON sent by your Node backend.

    store_chunk(
        chunk_id=request["id"],
        text=request["text"],
        metadata=request["metadata"]
    )

    return {
        "success": True
    }


@app.post("/search")
def search(request: dict):
    print("SEARCH REQUEST RECEIVED:", request)
    query = request["query"]

    top_k = request.get("top_k", 5)#Get top_k from the request. If the request doesn't provide it, use 5.
    repo_name=request["repoName"]
    results = search_chunks(
        query=query,
        repo_name=repo_name,
        top_k=top_k
    )

    return results