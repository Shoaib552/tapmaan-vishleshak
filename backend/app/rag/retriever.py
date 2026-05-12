from app.rag.embeddings import embedding_engine
from app.rag.store import vector_store


class ContextRetriever:
    def __init__(self, top_k: int = 3):
        self.top_k = top_k

    def get_relevant_docs(self, query: str) -> str:
        try:
            query_embedding = embedding_engine.encode(query)

            results = vector_store.query(
                query_embeddings=[query_embedding],
                n_results=self.top_k
            )

            docs = results.get("documents", [[]])[0]

            return "\n".join(docs) if docs else ""

        except Exception as e:
            print("RAG ERROR:", str(e))
            return ""


retriever = ContextRetriever()