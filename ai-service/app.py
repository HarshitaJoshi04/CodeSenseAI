from fastapi import FastAPI
from services.vector_service import store_chunk
from services.vector_service import search_chunks
app = FastAPI(title="CodeSense AI Service")

@app.get("/")
def home():
    return {
        "message": "AI Service Running"
    }

@app.post("/store")
def store(request: dict):

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

    query = request["query"]

    top_k = request.get("top_k", 5)

    results = search_chunks(
        query=query,
        top_k=top_k
    )

    return results