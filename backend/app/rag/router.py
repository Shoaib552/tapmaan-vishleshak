class IntentRouter:
    def classify(self, question: str) -> str:
        q = question.lower()

        if any(x in q for x in ["go outside", "walk", "safe", "health"]):
            return "outdoor_decision"

        if any(x in q for x in ["aqi", "pollution"]):
            return "aqi"

        if any(x in q for x in ["forecast", "tomorrow", "rain"]):
            return "forecast"

        if any(x in q for x in ["wind", "speed"]):
            return "wind"

        return "general"