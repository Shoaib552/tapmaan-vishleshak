from sentence_transformers import SentenceTransformer
from typing import List

class EmbeddingEngine:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        # Using a specialized local embedding model (fast + accurate)
        self.model = SentenceTransformer(model_name)

    def encode(self, text: str) -> List[float]:
        return self.model.encode(text).tolist()

embedding_engine = EmbeddingEngine()
