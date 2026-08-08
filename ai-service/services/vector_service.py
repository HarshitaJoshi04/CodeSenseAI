import chromadb
from services.embedding_service import generate_embedding

client = chromadb.PersistentClient(path="./chroma_db")

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


def search_chunks(query, top_k=5):

    query_embedding = generate_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=[
            "documents",
            "metadatas",
            "distances"
        ]
    )

    return results