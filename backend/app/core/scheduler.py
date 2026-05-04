from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.weather_monitor import check_environmental_conditions
import logging

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Run every 30 minutes
    scheduler.add_job(check_environmental_conditions, 'interval', minutes=30)
    scheduler.start()
    logging.info("Started background alert scheduler")

def stop_scheduler():
    scheduler.shutdown()
    logging.info("Stopped background alert scheduler")
