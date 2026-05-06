from fastapi import APIRouter, Request
from app.services.weather_api import fetch_weather_data, fetch_weather_by_coords
from app.core.limiter import limiter

router = APIRouter()

@router.get("/weather")
@limiter.limit("60/minute")
async def get_weather(request: Request, city: str, lang: str = "en"):
    return await fetch_weather_data(city, lang)

@router.get("/weather/coords")
@limiter.limit("60/minute")
async def get_weather_by_coords_endpoint(request: Request, lat: float, lon: float, lang: str = "en"):
    return await fetch_weather_by_coords(lat, lon, lang)
