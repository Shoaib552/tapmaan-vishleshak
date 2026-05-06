from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.services.rag_service import rag_service

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    weather_context: Dict[str, Any]

class ChatResponse(BaseModel):
    answer: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    # This endpoint receives the user's question and current weather data
    if not request.question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
        
    answer = await rag_service.get_response(request.question, request.weather_context)
    return ChatResponse(answer=answer)
