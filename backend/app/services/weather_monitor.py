import httpx
from app.core.config import settings
from app.db.mongodb import get_database
from app.services.email import send_alert_email
from app.services.whatsapp import send_whatsapp_alert
from datetime import datetime
import logging

async def check_environmental_conditions():
    """
    Monitors real environmental conditions for users and triggers alerts.
    """
    db = get_database()
    
    # Safety guard: if MongoDB is not connected (e.g., network blip), skip this run
    if db is None:
        logging.warning("MongoDB not connected. Skipping this scheduler run.")
        return

    # Get all users who have a location set
    cursor = db.users.find({"location": {"$exists": True, "$ne": ""}})
    users = await cursor.to_list(length=1000)

    for user in users:
        city = user.get("location")
        email = user.get("email")
        
        # Skip users who haven't set a location yet
        if not city:
            continue
            
        try:
            # Fetch real weather and AQI for the user's city
            async with httpx.AsyncClient() as client:
                # Get coordinates for the city
                geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={settings.OPENWEATHER_API_KEY}"
                geo_resp = await client.get(geo_url)
                geo_data = geo_resp.json()
                
                if not geo_data:
                    continue
                    
                lat, lon = geo_data[0]["lat"], geo_data[0]["lon"]
                
                # Check Real AQI
                aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={settings.OPENWEATHER_API_KEY}"
                aqi_resp = await client.get(aqi_url)
                aqi_data = aqi_resp.json()
                aqi_level = aqi_data["list"][0]["main"]["aqi"] # 1-5
                
                # Check Real Weather
                weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={settings.OPENWEATHER_API_KEY}"
                weather_resp = await client.get(weather_url)
                weather_data = weather_resp.json()
                temp = weather_data["main"]["temp"]
                
                alerts_triggered = []
                
                # Trigger real AQI alert (Level 4 = Poor, 5 = Very Poor)
                if aqi_level >= 4:
                    alerts_triggered.append({
                        "type": "High Pollution Warning",
                        "location": city,
                        "message": f"Real-time AQI in {city} has reached a dangerous level ({aqi_level}). Please wear a mask.",
                        "severity": "high"
                    })
                
                # Trigger real Heatwave alert
                if temp > 37:
                    alerts_triggered.append({
                        "type": "Extreme Heat Alert",
                        "location": city,
                        "message": f"Intense heat detected in {city} ({temp}°C). Stay hydrated and stay indoors.",
                        "severity": "critical"
                    })

                # Send actual emails if alerts were triggered
                for alert in alerts_triggered:
                    alert["timestamp"] = datetime.utcnow()
                    alert["user_email"] = email
                    await db.alerts.insert_one(alert)
                    
                    # Send Email Alert
                    await send_alert_email(
                        email_list=[email],
                        alert_type=alert["type"],
                        location=alert["location"],
                        message=alert["message"]
                    )

                    # Send WhatsApp Alert (if phone exists)
                    phone = user.get("phone")
                    if phone:
                        await send_whatsapp_alert(
                            phone_number=phone,
                            alert_type=alert["type"],
                            location=alert["location"],
                            message=alert["message"]
                        )
                        
                    logging.info(f"Sent REAL {alert['type']} Multi-Channel alert to {email}")

        except Exception as e:
            logging.error(f"Error checking weather for {city}: {str(e)}")
            continue

    return

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
    
    # Fetch all users, including both email and phone fields
    cursor = db.users.find({}, {"email": 1, "phone": 1})
    users = await cursor.to_list(length=1000)
    
    # Send email alerts to all users
    emails = [user["email"] for user in users if user.get("email")]
    if emails:
        await send_alert_email(emails, alert_type, location, message)
        
    # Send WhatsApp alerts to users who have registered a phone number
    for user in users:
        phone = user.get("phone")
        if phone:
            await send_whatsapp_alert(
                phone_number=phone,
                alert_type=alert_type,
                location=location,
                message=message
            )
            
    return alert
