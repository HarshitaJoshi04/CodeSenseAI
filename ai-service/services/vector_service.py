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


def search_chunks(query, repo_name, repo_id=None, top_k=5, file_path=None):
    print("QUERY:", query)
    print("REPO NAME:", repo_name)
    print("REPO ID:", repo_id)
    print("FILTER FILE PATH:", file_path)

    query_embedding = generate_embedding(query)

    filters = []
    if repo_id:
        filters.append({"repoId": repo_id})
    else:
        filters.append({"repoName": repo_name})

    if file_path:
        filters.append({"filePath": file_path})

    if len(filters) > 1:
        where_clause = {
            "$and": filters
        }
    else:
        where_clause = filters[0]

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