from sentence_transformers import SentenceTransformer

model = SentenceTransformer(
    "BAAI/bge-small-en-v1.5"
)


def generate_embedding(text: str):

    embedding = model.encode(text) #model.encode returns a numpy array, so we convert it to a list before returning.ex:array([0.23, -0.11, 0.82])

    return embedding.tolist() #so we convert it to a list