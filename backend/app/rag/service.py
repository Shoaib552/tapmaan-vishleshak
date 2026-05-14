import ollama
import logging
from app.rag.retriever import retriever
from app.rag.prompts import RAG_PROMPT_TEMPLATE, SYSTEM_PROMPT
from app.rag.utils import detect_intent, format_time

class DynamicRAGService:
    def __init__(self, model: str = "llama3.2"):
        self.model = model

    async def get_response(self, question: str, weather_context: dict, chat_history: list = None) -> str:
        # 1. Intent Detection
        intent = detect_intent(question)
        
        # 2. Retrieve semantic context from Knowledge Base
        kb_context = retriever.get_relevant_docs(question)
        
        # 3. Extract and format weather data based on context
        curr = weather_context.get("current", {})
        tz = curr.get("timezone", 0)
        
        # Extract fields
        main = curr.get("main", {})
        cond = curr.get("weather", [{}])[0].get("description", "N/A")
        air = weather_context.get("air_quality", {})
        aqi_val = air.get("list", [{}])[0].get("main", {}).get("aqi", 0)
        
        # Explicit mapping to prevent AI "Star Rating" confusion
        aqi_labels = {
            1: "Good (Level 1)",
            2: "Fair (Level 2)",
            3: "Moderate (Level 3)",
            4: "Poor (Level 4)",
            5: "Very Poor (Level 5) - CRITICAL DANGER"
        }
        aqi_desc = aqi_labels.get(aqi_val, f"Unknown (Value: {aqi_val})")
        
        weather_summary = f"""
        City: {curr.get('name')}
        Current Temp: {main.get('temp')}°C (Feels like {main.get('feels_like')}°C)
        Conditions: {cond}
        Humidity: {main.get('humidity')}%
        Wind Speed: {curr.get('wind', {}).get('speed')} m/s
        Current AQI Status: {aqi_desc}
        Sunrise/Sunset: {format_time(curr.get('sys', {}).get('sunrise'), tz)} / {format_time(curr.get('sys', {}).get('sunset'), tz)}
        """

        # 4. Build Chat History String
        history_str = ""
        if chat_history:
            history_str = "\n".join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in chat_history[-5:]])

        # 5. Final Prompt Assembly
        prompt = RAG_PROMPT_TEMPLATE.format(
            weather_context=weather_summary,
            kb_context=kb_context,
            history=history_str or "No previous history.",
            question=question
        )

        try:
            # 6. Call local LLM (Ollama)
            res = ollama.chat(model=self.model, messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ])
            return res['message']['content']
        except Exception as e:
            logging.error(f"RAG Service Error: {str(e)}")
            return "Assistant is temporarily offline. Please ensure Ollama server is running locally."

rag_orchestrator = DynamicRAGService()
