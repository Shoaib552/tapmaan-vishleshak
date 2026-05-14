from app.rag.orchestrator import rag_orchestrator

class RAGService:
    async def get_response(self, question, weather_context, chat_history=None):
        return await rag_orchestrator.get_response(
            question, weather_context, chat_history
        )

rag_service = RAGService()