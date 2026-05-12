import chromadb
import os

class VectorStore:
    def __init__(self, path: str = "app/rag/vectordb"):
        # Absolute path relative to backend root
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        persist_path = os.path.join(base_path, "app", "rag", "vectordb")
        
        self.client = chromadb.PersistentClient(path=persist_path)
        # MUST match the name used in ingest.py
        self.collection = self.client.get_or_create_collection("weather_rag")

    def query(self, query_embeddings: list, n_results: int = 3):
        return self.collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results
        )

vector_store = VectorStore()
