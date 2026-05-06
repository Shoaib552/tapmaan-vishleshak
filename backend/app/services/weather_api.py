import httpx
from app.core.config import settings
from fastapi import HTTPException

OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

async def fetch_weather_data(city: str, lang: str = "en"):
    if not hasattr(settings, "OPENWEATHER_API_KEY") or not settings.OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="Weather API Key not configured on server")

    async with httpx.AsyncClient() as client:
        try:
            # 1. Fetch Current Weather
            weather_url = f"{OPENWEATHER_BASE_URL}/weather?q={city}&units=metric&lang={lang}&appid={settings.OPENWEATHER_API_KEY}"
            weather_res = await client.get(weather_url)
            
            if weather_res.status_code != 200:
                raise HTTPException(status_code=weather_res.status_code, detail="City not found or API error")
            
            weather_data = weather_res.json()
            lat, lon = weather_data["coord"]["lat"], weather_data["coord"]["lon"]

            # 2. Fetch Forecast
            forecast_url = f"{OPENWEATHER_BASE_URL}/forecast?lat={lat}&lon={lon}&units=metric&lang={lang}&appid={settings.OPENWEATHER_API_KEY}"
            forecast_res = await client.get(forecast_url)
            forecast_data = forecast_res.json() if forecast_res.status_code == 200 else None

            # 3. Fetch Air Quality
            aqi_url = f"{OPENWEATHER_BASE_URL}/air_pollution?lat={lat}&lon={lon}&appid={settings.OPENWEATHER_API_KEY}"
            aqi_res = await client.get(aqi_url)
            aqi_data = aqi_res.json() if aqi_res.status_code == 200 else None

            return {
                "weather": weather_data,
                "forecast": forecast_data,
                "air_quality": aqi_data
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch weather: {str(e)}")

async def fetch_weather_by_coords(lat: float, lon: float, lang: str = "en"):
    if not hasattr(settings, "OPENWEATHER_API_KEY") or not settings.OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="Weather API Key not configured on server")

    async with httpx.AsyncClient() as client:
        try:
            # 1. Current Weather
            weather_url = f"{OPENWEATHER_BASE_URL}/weather?lat={lat}&lon={lon}&units=metric&lang={lang}&appid={settings.OPENWEATHER_API_KEY}"
            weather_res = await client.get(weather_url)
            weather_data = weather_res.json()

            # 2. Forecast
            forecast_url = f"{OPENWEATHER_BASE_URL}/forecast?lat={lat}&lon={lon}&units=metric&lang={lang}&appid={settings.OPENWEATHER_API_KEY}"
            forecast_res = await client.get(forecast_url)
            forecast_data = forecast_res.json()

            # 3. Air Quality
            aqi_url = f"{OPENWEATHER_BASE_URL}/air_pollution?lat={lat}&lon={lon}&appid={settings.OPENWEATHER_API_KEY}"
            aqi_res = await client.get(aqi_url)
            aqi_data = aqi_res.json()

            return {
                "weather": weather_data,
                "forecast": forecast_data,
                "air_quality": aqi_data
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch weather: {str(e)}")
