from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from app.services.weather_monitor import trigger_manual_alert
from app.api.endpoints.auth import get_current_user
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("/alerts")
async def get_alerts(limit: int = 10):
    db = get_database()
    cursor = db.alerts.find().sort("timestamp", -1).limit(limit)
    alerts = await cursor.to_list(length=limit)
    for alert in alerts:
        alert["_id"] = str(alert["_id"])
    return alerts

@router.post("/send-alert")
async def send_manual_alert(
    alert_type: str, 
    location: str, 
    message: str,
    current_user: dict = Depends(get_current_user)
):
    # In a real app, you'd check if current_user is an admin
    alert = await trigger_manual_alert(alert_type, location, message)
    alert["_id"] = str(alert["_id"])
    return {"message": "Alert sent successfully", "alert": alert}
