import chromadb  #ChromaDB is where you're storing your repository's code chunks along with their embeddings.
from services.embedding_service import generate_embedding

client = chromadb.PersistentClient(path="./chroma_db")#a ChromaDB client that stores its data in: ai-service/chroma_db/
#Because it's PersistentClient, the data isn't just kept temporarily in RAM.It is saved on your computer.So after restarting your Python service, your stored vectors can still exist.
collection = client.get_or_create_collection(
    name="repository_chunks"
)


def store_chunk(chunk_id, text, metadata):

    embedding = generate_embedding(text)

    collection.add(
        ids=[chunk_id],
        documents=[text],
        embeddings=[embedding],
        metadatas=[metadata]
    )


def search_chunks(query, repo_name, top_k=5, file_path=None):
    print("QUERY:", query)
    print("REPO NAME:", repo_name)
    print("FILTER FILE PATH:", file_path)

    query_embedding = generate_embedding(query)

    # Dynamic filter condition using ChromaDB's $and operator
    if file_path:
        where_clause = {
            "$and": [
                {"repoName": repo_name},
                {"filePath": file_path}
            ]
        }
    else:
        where_clause = {
            "repoName": repo_name
        }

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_clause,
        include=[
            "documents",
            "metadatas",
            "distances"
        ]
    )

    return results