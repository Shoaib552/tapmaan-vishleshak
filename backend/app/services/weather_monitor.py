import httpx
from app.core.config import settings
from app.db.mongodb import get_database
from app.services.email import send_alert_email
from datetime import datetime
import random
import logging

async def check_environmental_conditions():
    """
    Monitors environmental conditions and triggers alerts if necessary.
    In a real app, this would call various APIs. Here we simulate some logic.
    """
    db = get_database()
    alerts_triggered = []

    # 1. Simulate Earthquake Check
    # In reality, use USGS API: https://earthquake.usgs.gov/fdsnws/event/1/
    if random.random() < 0.05:  # 5% chance for simulation
        alerts_triggered.append({
            "type": "Earthquake",
            "location": "Global / Regional",
            "message": "Seismic activity detected. Please stay away from heavy objects and take cover.",
            "severity": "critical"
        })

    # 2. AQI Check (Simulated or Real if API Key is present)
    # We'll use a fixed location for demonstration or simulate high AQI
    aqi_value = random.randint(50, 250)
    if aqi_value > 200:
        alerts_triggered.append({
            "type": "High AQI",
            "location": "Local Area",
            "message": f"Air Quality Index has reached {aqi_value}. Please wear a mask and avoid outdoor activities.",
            "severity": "high"
        })

    # 3. Heavy Rain Check
    if random.random() < 0.1:
        alerts_triggered.append({
            "type": "Heavy Rain",
            "location": "Local Area",
            "message": "Heavy rainfall expected. Beware of potential flash floods and avoid waterlogged areas.",
            "severity": "moderate"
        })

    if not alerts_triggered:
        return

    # Process triggered alerts
    for alert in alerts_triggered:
        # Save alert to DB
        alert["timestamp"] = datetime.utcnow()
        await db.alerts.insert_one(alert)

        # Identify users to notify (In this demo, we notify all registered users)
        cursor = db.users.find({}, {"email": 1})
        users = await cursor.to_list(length=1000)
        emails = [user["email"] for user in users]

        if emails:
            await send_alert_email(
                email_list=emails,
                alert_type=alert["type"],
                location=alert["location"],
                message=alert["message"]
            )
            logging.info(f"Sent {alert['type']} alert to {len(emails)} users")

async def trigger_manual_alert(alert_type: str, location: str, message: str):
    db = get_database()
    alert = {
        "type": alert_type,
        "location": location,
        "message": message,
        "severity": "critical",
        "timestamp": datetime.utcnow()
    }
    await db.alerts.insert_one(alert)
    
    cursor = db.users.find({}, {"email": 1})
    users = await cursor.to_list(length=1000)
    emails = [user["email"] for user in users]
    
    if emails:
        await send_alert_email(emails, alert_type, location, message)
    
    return alert
