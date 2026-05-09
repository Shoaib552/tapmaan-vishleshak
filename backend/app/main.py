from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, alerts
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.core.scheduler import start_scheduler, stop_scheduler
from app.core.config import settings
import uvicorn
import logging
import time
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(title=settings.PROJECT_NAME)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logging.info(f"RID: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
    return response

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    stop_scheduler()

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(alerts.router, tags=["Alerts"])

@app.get("/")
async def root():
    return {"message": "Welcome to Tapmaan Vishleshak API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
