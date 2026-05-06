import ollama
from typing import List, Dict
import logging

class RAGService:
    def __init__(self, model_name: str = "llama3.2"):
        self.model_name = model_name
        
    async def get_response(self, question: str, weather_context: Dict) -> str:
        # Extract detailed data from the expanded context
        current = weather_context.get('current', {})
        forecast = weather_context.get('forecast', {})
        air_quality = weather_context.get('air_quality', {})
        
        # Format AQI nicely
        aqi_list = air_quality.get('list', [{}])
        aqi_value = aqi_list[0].get('main', {}).get('aqi', 'N/A')
        aqi_desc = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"}.get(aqi_value, "Unknown")

        prompt = f"""
        You are Tapmaan Assistant, a professional and helpful weather expert. 
        
        CRITICAL RULE: You only have weather data for the city mentioned in the context below. 
        If the user asks about a DIFFERENT city, tell them to search for it.
        
        WEATHER DATA FOR {current.get('name', 'Selected City')}:
        
        1. CURRENT CONDITIONS:
        - Temperature: {current.get('main', {}).get('temp')}°C
        - Feels Like: {current.get('main', {}).get('feels_like')}°C
        - Conditions: {current.get('weather', [{}])[0].get('description')}
        - Humidity: {current.get('main', {}).get('humidity')}%
        - Wind Speed: {current.get('wind', {}).get('speed')} m/s
        
        2. AIR QUALITY (AQI):
        - AQI Level: {aqi_value} ({aqi_desc})
        - (Level 1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor)
        
        3. 5-DAY FORECAST:
        - We have a full 5-day forecast available. If the user asks about "tomorrow" or "later", check your data.
        
        User Question: {question}
        
        INSTRUCTIONS:
        - Always mention the AQI if the user asks about health or "going outside".
        - Be precise. If it's 34°C and AQI is Poor, warn them!
        - Keep answers professional and data-driven.
        """
        
        try:
            # Call the local Ollama instance
            response = ollama.chat(
                model=self.model_name,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return response['message']['content']
        except Exception as e:
            logging.error(f"Error calling Ollama: {str(e)}")
            return "I apologize, but I am having trouble connecting to my local AI engine. Please ensure Ollama is running."

# Initialize a global service instance
rag_service = RAGService()
