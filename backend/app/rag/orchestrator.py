import re
import logging
import ollama

from app.rag.retriever import retriever
from app.rag.prompts import RAG_PROMPT_TEMPLATE, SYSTEM_PROMPT, AQI_UNKNOWN_RESTRICTION
from app.rag.rule_engine import WeatherRuleEngine

logger = logging.getLogger(__name__)


class RAGOrchestrator:
    def __init__(self):
        self.model = "llama3.2"
        self.rule_engine = WeatherRuleEngine()

    # ── Non-weather intent patterns ────────────────────────────────────────
    NON_WEATHER_PATTERNS = [
        r"\b(hi+|hello|hey+|howdy|greetings|sup|wassup)\b",
        r"\bhow are you\b",
        r"\bwhat(\'?s| is) your name\b",
        r"\bwho are you\b",
        r"\bwhat can you do\b",
        r"\bthank(s| you)\b",
        r"\bgood (morning|evening|night|afternoon)\b",
        r"\bnice to meet\b",
        r"\bare you (a robot|an? ai|a bot)\b",
    ]

    # ── AQI hallucination forbidden patterns ───────────────────────────────
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

        # ── Step 0: Greeting / non-weather intent check ────────────────────
        question_lower = question.lower()
        for pattern in self.NON_WEATHER_PATTERNS:
            if re.search(pattern, question_lower):
                logger.info("[Intent] Non-weather question detected — returning greeting.")
                return self._get_greeting_response(question_lower)

        # ── Step 1: KB retrieval ───────────────────────────────────────────
        kb_context = retriever.get_relevant_docs(question)

        # ── Step 2: History ────────────────────────────────────────────────
        history_text = ""
        if history:
            history_text = "\n".join(
                [f"{m['role']}: {m['content']}" for m in history[-5:]]
            )

        # ── Step 3: Safe data extraction (never infers missing values) ─────
        temp, aqi_value = self._extract_weather_values(weather_context)

        # ── Step 4: Rule engine — SOLE decision authority ──────────────────
        rule_output = self.rule_engine.decide(temp=temp, aqi=aqi_value)

        logger.info(
            "[RuleEngine] decision=%s | temp=%s | aqi=%s | aqi_available=%s",
            rule_output.decision,
            rule_output.temp_status,
            rule_output.aqi_status,
            rule_output.aqi_available,
        )

        # ── Step 5: Build strictly constrained prompt ──────────────────────
        data_notes = "AQI data unavailable — not considered in decision." \
            if not rule_output.aqi_available else "All data present."

        aqi_restriction = AQI_UNKNOWN_RESTRICTION \
            if not rule_output.aqi_available else ""

        prompt = RAG_PROMPT_TEMPLATE.format(
            decision        = rule_output.decision,
            reason          = rule_output.reason,
            temp_status     = rule_output.temp_status,
            aqi_status      = rule_output.aqi_status,
            data_notes      = data_notes,
            aqi_restriction = aqi_restriction,
        )

        # ── Step 6: LLM call (formatting only, zero temperature) ──────────
        llm_output = self._call_llm(prompt)

        # ── Step 7: Post-processing guardrail ─────────────────────────────
        # If AQI was unknown, LLM must NOT mention air quality in any form
        if not rule_output.aqi_available:
            for pattern in self.AQI_HALLUCINATION_PATTERNS:
                if re.search(pattern, llm_output, re.IGNORECASE):
                    logger.warning(
                        "[Guard] Hallucination detected (pattern: %s) — using deterministic fallback.",
                        pattern
                    )
                    return self._deterministic_fallback(rule_output)

        # ── Step 8: Decision label must appear in LLM output ──────────────
        if rule_output.decision.lower() not in llm_output.lower():
            logger.warning("[Guard] LLM dropped decision label — using deterministic fallback.")
            return self._deterministic_fallback(rule_output)

        return llm_output

    # ── Private helpers ────────────────────────────────────────────────────

    def _extract_weather_values(self, weather_context: dict):
        """
        Safely extracts temp and AQI.
        Returns (None, None) for any missing/malformed field.
        NEVER infers or defaults values.
        """
        temp = None
        aqi_value = None

        try:
            current = weather_context.get("current", {})
            main = current.get("main", {})
            raw_temp = main.get("temp")
            if raw_temp is not None:
                temp = float(raw_temp)
        except (TypeError, ValueError) as e:
            logger.warning("[Extractor] Failed to parse temperature: %s", e)

        try:
            aqi_list = weather_context.get("air_quality", {}).get("list", [])
            if aqi_list and isinstance(aqi_list[0], dict):
                raw_aqi = aqi_list[0].get("main", {}).get("aqi")
                if raw_aqi is not None:
                    aqi_value = int(raw_aqi)
        except (TypeError, ValueError, IndexError) as e:
            logger.warning("[Extractor] Failed to parse AQI: %s", e)

        logger.info("[Extractor] temp=%s | aqi=%s", temp, aqi_value)
        return temp, aqi_value

    def _call_llm(self, prompt: str) -> str:
        """Calls Ollama with zero temperature. Returns empty string on failure."""
        try:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
                options={
                    "temperature": 0.0,  # Zero creativity — formatting only
                    "top_p": 1.0,
                    "seed": 42,          # Reproducible output
                },
            )
            return response["message"]["content"].strip()
        except Exception as e:
            logger.error("[LLM] Call failed: %s", e)
            return ""

    def _deterministic_fallback(self, rule_output) -> str:
        """
        100% deterministic response — zero LLM involvement.
        Used when LLM output fails guardrail validation.
        """
        lines = [
            f"Decision: {rule_output.decision}",
            f"Reason: {rule_output.reason}",
            f"Temperature: {rule_output.temp_status}",
            f"AQI: {rule_output.aqi_status}",
        ]
        if not rule_output.aqi_available:
            lines.append(
                "Note: Air quality data was not available and was not considered in this decision."
            )
        return "\n".join(lines)

    def _get_greeting_response(self, question: str) -> str:
        """Returns a friendly non-weather response for greetings and meta questions."""
        if any(x in question for x in ["your name", "who are you"]):
            return (
                "I'm Tapmaan Assistant 🌤️ — your local weather safety advisor!\n\n"
                "I can help you with:\n"
                "• Is it safe to go outside?\n"
                "• Current AQI and air quality\n"
                "• Temperature and heat safety\n"
                "• Should I exercise outdoors?\n\n"
                "Just ask me anything about the current weather conditions!"
            )
        if "how are you" in question:
            return (
                "I'm working well, thank you! 😊\n\n"
                "I'm here to keep you safe in current weather conditions.\n"
                "Try asking: 'Should I go outside?' and I'll check the live weather for you! 🌡️"
            )
        if "thank" in question:
            return "You're welcome! Stay safe out there. 🌤️"
        if any(x in question for x in ["what can you do", "help"]):
            return (
                "I'm your Tapmaan Weather Safety Assistant! Here's what I can do:\n\n"
                "• Tell you if it's safe to go outside\n"
                "• Check current AQI and air quality levels\n"
                "• Warn you about extreme heat or dangerous conditions\n"
                "• Give safety recommendations based on live weather data\n\n"
                "Ask me: 'Should I go for a walk?' or 'Is the air safe today?'"
            )
        if any(x in question for x in ["good morning", "good evening", "good night", "good afternoon"]):
            return (
                "Good day! 🌤️ I'm Tapmaan Assistant.\n"
                "Ask me about today's weather safety — like 'Should I go outside?' "
                "and I'll check the live conditions for you!"
            )
        # Default greeting
        return (
            "Hello! 👋 I'm Tapmaan Assistant — your weather safety advisor.\n\n"
            "Ask me things like:\n"
            "• 'Should I go outside right now?'\n"
            "• 'Is the air quality safe today?'\n"
            "• 'Is it too hot to exercise outside?'"
        )


rag_orchestrator = RAGOrchestrator()