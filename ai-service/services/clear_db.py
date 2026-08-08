
import chromadb

client = chromadb.PersistentClient(
    path="./chroma_db"
)

try:
    client.delete_collection(
        name="repository_chunks"
    )

    print("Collection deleted successfully.")

except Exception:
    print("Collection does not exist.")

client.get_or_create_collection(
    name="repository_chunks"
)

print("Fresh collection created.")

