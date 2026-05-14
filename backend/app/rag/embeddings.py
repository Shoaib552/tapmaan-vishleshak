from sentence_transformers import SentenceTransformer
from typing import List
import os

class EmbeddingEngine:
    def __init__(self):
        # Load from local path — avoids HuggingFace download on every deploy
        base_path = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_path, "embedding_model")

        if os.path.exists(model_path):
            print(f"[Embeddings] Loading model from local path: {model_path}")
            self.model = SentenceTransformer(model_path)
        else:
            # Fallback to download if local not found
            print("[Embeddings] Local model not found — downloading from HuggingFace...")
            self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def encode(self, text: str) -> List[float]:
        return self.model.encode(text).tolist()

embedding_engine = EmbeddingEngine()