from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.weather_monitor import check_environmental_conditions
import logging

from datetime import datetime

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Run every 30 minutes, but trigger first check IMMEDIATELY
    scheduler.add_job(
        check_environmental_conditions, 
        'interval', 
        minutes=30,
        next_run_time=datetime.now()
    )
    scheduler.start()
    logging.info("Started background alert scheduler")

def stop_scheduler():
    scheduler.shutdown()
    logging.info("Stopped background alert scheduler")
