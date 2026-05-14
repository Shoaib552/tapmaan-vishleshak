from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
import uvicorn
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.core.scheduler import start_scheduler, stop_scheduler
from app.core.config import settings
from app.api.endpoints import auth, alerts, weather, chat
from app.core.limiter import limiter

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(title=settings.PROJECT_NAME)

# Initialize Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logging.info(f"RID: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
    return response

# CORS configuration - Restricted for security
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://tapmaan-vishleshak.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    start_scheduler()
    
    # Security check: Log if weather key is loaded (masked)
    if hasattr(settings, "OPENWEATHER_API_KEY") and settings.OPENWEATHER_API_KEY:
        logging.info(f"Weather API Key loaded: {settings.OPENWEATHER_API_KEY[:4]}****")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    stop_scheduler()

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(alerts.router, tags=["Alerts"])
app.include_router(weather.router, tags=["Weather"])
app.include_router(chat.router, tags=["Chat Assistant"])

@app.get("/")
async def root():
    return {"message": "Welcome to Tapmaan Vishleshak API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
