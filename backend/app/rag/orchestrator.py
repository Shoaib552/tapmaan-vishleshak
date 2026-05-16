import re
import os
import logging
from typing import List, Dict, Any, Optional, Union
from groq import Groq

from app.rag.retriever import retriever
from app.rag.prompts import RAG_PROMPT_TEMPLATE, SYSTEM_PROMPT, AQI_UNKNOWN_RESTRICTION
from app.rag.rule_engine import WeatherRuleEngine
from app.core.config import settings

logger = logging.getLogger(__name__)


class RAGOrchestrator:
    def __init__(self):
        self.model       = "llama-3.1-8b-instant"   # Groq free model
        self.rule_engine = WeatherRuleEngine()
        self.client      = Groq(api_key=settings.GROQ_API_KEY)

    # ── 1. Greeting / Casual patterns ──────────────────────────────────────
    GREETING_PATTERNS = [
        r"\b(hi+|hello|hey+|howdy|greetings|sup|wassup)\b",
        r"\bhow\s+(are|r)\s+(you|u)\b",
        r"\bwhat(\'?s| is) your name\b",
        r"\bwho are you\b",
        r"\bwhat can you do\b",
        r"\bthank(s| you)\b",
        r"\bgood (morning|evening|night|afternoon)\b",
        r"\bnice to meet\b",
        r"\bare you (a robot|an? ai|a bot)\b",
    ]

    # ── 2. Weather/Safety intent patterns ──────────────────────────────────
    WEATHER_INTENT_PATTERNS = [
        r"\b(weather|temp|temperature|aqi|air\s+quality|pollution)\b",
        r"\b(outside|outdoors|exercise|walk|run|jog|cycling)\b",
        r"\b(safe|safety|hot|cold|heat|warm|chilly)\b",
        r"\b(should|can)\s+i\s+(go|be|do)\b",
        r"\b(is|how)\s+it\s+(out|outside)\b",
    ]

    # ── 3. AQI hallucination forbidden patterns ────────────────────────────
    AQI_HALLUCINATION_PATTERNS = [
        r"\bpoor\s+air\b",
        r"\bair\s+quality\b",
        r"\bpollution\b",
        r"\bpollutant",
        r"\bAQI\b",
        r"\bunhealthy\s+air\b",
        r"\bhazardous\b",
        r"\bsmog\b",
        r"\bparticulate",
        r"\bpm2\.5\b",
        r"\bpm10\b",
        r"\bdangerous\s+air\b",
    ]

    async def get_response(self, question, weather_context, history=None):
        # ── Step 0: Extract actual user question ───────────────────────────
        actual_question = question
        if "\n\nUser: " in question:
            actual_question = question.split("\n\nUser: ")[-1].strip()
        elif "\n\nउपयोगकर्ता: " in question:
            actual_question = question.split("\n\nउपयोगकर्ता: ")[-1].strip()

        question_lower = actual_question.lower()

        # ── Step 1: Greeting detection ─────────────────────────────────────
        for pattern in self.GREETING_PATTERNS:
            if re.search(pattern, question_lower):
                logger.info("[Intent] Greeting detected.")
                return self._get_greeting_response(question_lower)

        # ── Step 2: Intent Classification (Weather vs General) ─────────────
        is_weather_intent = any(re.search(p, question_lower) for p in self.WEATHER_INTENT_PATTERNS)

        # ── Step 3: Handle General Assistant Mode ──────────────────────────
        if not is_weather_intent:
            logger.info("[Intent] General assistant query detected.")
            return await self._handle_general_query(actual_question, weather_context, history)

        # ── Step 4: Handle Weather Safety Mode (Hardened) ──────────────────
        logger.info("[Intent] Weather safety query detected.")
        return await self._handle_weather_query(actual_question, weather_context, history)

    async def _handle_weather_query(self, question, weather_context, history):
        """
        Hardened weather safety logic. Deterministic and hallucination-free.
        """
        # Safe data extraction
        temp, aqi_value = self._extract_weather_values(weather_context)
        
        # Rule engine — SOLE decision authority
        rule_output = self.rule_engine.decide(temp=temp, aqi=aqi_value)

        # Build strictly constrained prompt
        data_notes = "AQI data unavailable." if not rule_output.aqi_available else "All data present."
        aqi_restriction = AQI_UNKNOWN_RESTRICTION if not rule_output.aqi_available else ""

        prompt = RAG_PROMPT_TEMPLATE.format(
            decision        = rule_output.decision,
            reason          = rule_output.reason,
            temp_status     = rule_output.temp_status,
            aqi_status      = rule_output.aqi_status,
            data_notes      = data_notes,
            aqi_restriction = aqi_restriction,
            user_question   = question,
        )

        # LLM call (formatting only, zero history to prevent poisoning)
        llm_used   = True
        llm_output = self._call_llm(prompt, [])

        # Post-processing guardrail
        guardrail_hit = not self.validate_output(llm_output, rule_output)
        if guardrail_hit:
            llm_used   = False
            llm_output = self._deterministic_fallback(rule_output)

        return {
            "version":       "HARDENED_RAG_V1",
            "decision":      rule_output.decision,
            "reason":        rule_output.reason,
            "temp_status":   rule_output.temp_status,
            "aqi_status":    rule_output.aqi_status,
            "aqi_available": rule_output.aqi_available,
            "formatted":     llm_output,
            "llm_used":      llm_used,
            "guardrail_hit": guardrail_hit,
        }

    async def _handle_general_query(self, question, weather_context, history):
        """
        Flexible assistant mode for non-weather questions. Uses history.
        """
        history_messages = self._format_history(history)
        
        # Simple retrieval to see if we have project info
        kb_context = retriever.get_relevant_docs(question)
        
        system_msg = (
            "You are Tapmaan Assistant, a helpful weather and general assistant.\n"
            "If the question is about weather, answer based on facts.\n"
            "If it's a general question, answer politely using the provided context.\n"
        )

        # Inject dashboard context (city, local time) so the LLM can answer
        # questions like 'what time is it?' using real data from the UI.
        city = weather_context.get("city") or weather_context.get("current", {}).get("name")
        local_time = weather_context.get("local_time")

        if city or local_time:
            system_msg += "\n## Current Dashboard Context\n"
            if city:
                system_msg += f"- City: {city}\n"
            if local_time:
                system_msg += f"- Local Time: {local_time}\n"
            system_msg += "Use this data to answer questions about time, location, or conditions.\n"

        if kb_context:
            system_msg += f"\n## Knowledge Base Context\n{kb_context}"

        try:
            messages: Any = [
                {"role": "system", "content": system_msg},
                *history_messages,
                {"role": "user",   "content": question},
            ]

            response = self.client.chat.completions.create(
                model       = self.model,
                messages    = messages,
                temperature = 0.7, 
                max_tokens  = 500,
            )
            content = response.choices[0].message.content
            llm_output = content.strip() if content else ""
            
            return {
                "version":       "HARDENED_RAG_V1",
                "decision":      None,
                "reason":        None,
                "temp_status":   None,
                "aqi_status":    None,
                "aqi_available": False,
                "formatted":     llm_output,
                "llm_used":      True,
                "guardrail_hit": False,
            }
        except Exception as e:
            logger.error("[General] LLM failed: %s", e)
            return {"formatted": "I'm sorry, I encountered an error processing your request."}

    def validate_output(self, llm_output: str, rule_output) -> bool:
        if not rule_output.aqi_available:
            for pattern in self.AQI_HALLUCINATION_PATTERNS:
                if re.search(pattern, llm_output, re.IGNORECASE):
                    return False
        if rule_output.decision.lower() not in llm_output.lower():
            return False
        return True

    def _extract_weather_values(self, weather_context: Dict[str, Any]):
        temp: Optional[float] = None
        aqi_value: Optional[int] = None
        temp_paths = [["current", "main", "temp"], ["main", "temp"], ["temp"]]
        for path in temp_paths:
            val: Any = weather_context
            for key in path:
                if isinstance(val, dict): val = val.get(key)
                else: val = None; break
            if val is not None and not isinstance(val, dict):
                try: temp = float(val); break
                except: continue

        aqi_paths = [["air_quality", "list", 0, "main", "aqi"], ["air_pollution", "list", 0, "main", "aqi"], ["aqi"]]
        for path in aqi_paths:
            val: Any = weather_context
            for key in path:
                if isinstance(key, int):
                    if isinstance(val, list) and len(val) > key: val = val[key]
                    else: val = None; break
                elif isinstance(val, dict): val = val.get(key)
                else: val = None; break
            if val is not None and not isinstance(val, dict):
                try: aqi_value = int(val); break
                except: continue
        return temp, aqi_value

    def _call_llm(self, prompt: str, history_messages: list = []) -> str:
        try:
            messages: Any = [
                {"role": "system", "content": SYSTEM_PROMPT},
                *history_messages,
                {"role": "user",   "content": prompt},
            ]
            response = self.client.chat.completions.create(
                model       = self.model,
                messages    = messages,
                temperature = 0.3,
                max_tokens  = 900,
                seed        = 42,
            )
            content = response.choices[0].message.content
            return content.strip() if content else ""
        except Exception as e:
            logger.error("[LLM] call failed: %s", e)
            return ""

    def _format_history(self, history: Optional[List[Dict[str, Any]]]) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = []
        if history:
            for m in history[-6:]:
                role = str(m.get("role", "user"))
                if role in ["user", "assistant"]:
                    messages.append({"role": role, "content": str(m.get("content", ""))})
        return messages

    def _get_greeting_response(self, question: str) -> dict:
        content = "Hello! 👋 I'm Tapmaan Assistant — your weather safety advisor."
        if any(x in question for x in ["how are you", "how are u", "how r you", "how r u"]):
            content = (
                "I'm working well, thank you! 😊\n\n"
                "I'm here to keep you safe in current weather conditions.\n"
                "Try asking: 'Should I go outside?' and I'll check the live weather for you! 🌡️"
            )
        elif any(x in question for x in ["who are you", "what is your name"]):
            content = "I am Tapmaan Assistant, an AI built to help you navigate weather conditions safely."
            
        return {
            "decision":      None,
            "reason":        None,
            "temp_status":   None,
            "aqi_status":    None,
            "aqi_available": False,
            "formatted":     content,
            "llm_used":      False,
            "guardrail_hit": False,
        }

    def _deterministic_fallback(self, rule_output) -> str:
        lines = [
            f"Decision: {rule_output.decision}",
            f"Reason:   {rule_output.reason}",
            f"Temp:     {rule_output.temp_status}",
            f"AQI:      {rule_output.aqi_status}",
        ]
        if not rule_output.aqi_available:
            lines.append("(Note: Air quality data not available in knowledge base)")
        return "\n".join(lines)


rag_orchestrator = RAGOrchestrator()