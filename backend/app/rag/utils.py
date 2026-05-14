from datetime import datetime, timedelta

def detect_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["aqi", "pollution", "air"]): return "aqi"
    if any(w in q for w in ["forecast", "tomorrow", "later"]): return "forecast"
    if any(w in q for w in ["sunrise", "sunset", "sun"]): return "sun"
    if any(w in q for w in ["humidity", "wind", "pressure", "details"]): return "details"
    return "general"

def format_time(ts: int, offset: int) -> str:
    if not ts: return "N/A"
    # Convert Unix timestamp to UTC, add city's offset, and format
    utc_dt = datetime.utcfromtimestamp(ts)
    city_dt = utc_dt + timedelta(seconds=offset)
    return city_dt.strftime("%I:%M %p")
