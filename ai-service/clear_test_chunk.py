
import chromadb

client = chromadb.PersistentClient(
    path="./chroma_db"
)

collection = client.get_collection(
    name="repository_chunks"
)

print("Before:", collection.count())

# Delete the old test chunk
collection.delete(
    ids=["chunk_1"]
)

print("After:", collection.count())

# Verify it is really gone
result = collection.get(
    ids=["chunk_1"]
)

print("Remaining test chunk:", result["ids"])

