from fastapi import FastAPI
from services.vector_service import store_chunk
from services.vector_service import search_chunks
from services.vector_service import delete_repository_chunks

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
    top_k = request.get("top_k", 5)
    repo_name = request["repoName"]
    repo_id = request.get("repoId", None)
    file_path = request.get("filePath", None) # Get optional filter

    results = search_chunks(
        query=query,
        repo_name=repo_name,
        repo_id=repo_id,
        top_k=top_k,
        file_path=file_path
    )

    return results

@app.delete("/repository/{repo_id}")
def delete_repository(repo_id: str):

    delete_repository_chunks(repo_id)

    return {
        "success": True,
        "message": "Repository chunks deleted successfully",
         "deletedChunks": deleted_count
    } 