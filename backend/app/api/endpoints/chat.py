from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.rag_service import rag_service

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    weather_context: Dict[str, Any]
    history: list = []

class ChatResponse(BaseModel):
    version:       Optional[str] = None
    decision:      Optional[str] = None
    reason:        Optional[str] = None
    temp_status:   Optional[str] = None
    aqi_status:    Optional[str] = None
    formatted:     str
    llm_used:      bool = True
    guardrail_hit: bool = False

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    # This endpoint receives the user's question and current weather data
    if not request.question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
        
    result = await rag_service.get_response(
        request.question, 
        request.weather_context,
        request.history
    )
    
    # If result is already a dict (new orchestrator), unpack it. 
    # If it's a string (old service), wrap it.
    if isinstance(result, dict):
        return ChatResponse(**result)
    
    return ChatResponse(formatted=result)
