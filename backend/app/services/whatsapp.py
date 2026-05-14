import httpx
import logging
from app.core.config import settings

async def send_whatsapp_alert(phone_number: str, alert_type: str, location: str, message: str):
    """
    Sends a WhatsApp message using the Meta Cloud API.
    Note: For production, you usually need to use a pre-approved Template.
    """
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
        logging.warning("WhatsApp credentials missing. Skipping alert.")
        return False

    url = f"https://graph.facebook.com/v17.0/{settings.WHATSAPP_PHONE_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    # Clean phone number (remove +, spaces, etc.)
    clean_phone = "".join(filter(str.isdigit, phone_number))
    logging.info(f"Attempting WhatsApp alert to: {clean_phone}")

    # Construct the dynamic alert message body
    full_message = f"🚨 *Tapmaan Vishleshak Alert: {alert_type}* 🚨\n\n📍 *Location:* {location}\n\n{message}\n\nStay safe!"

    # Data payload for a free-form text message.
    # IMPORTANT META API RULE: 
    # Meta only allows sending free-form 'text' messages if the user has messaged your WhatsApp 
    # Business number within the last 24 hours. 
    # If they haven't, Meta will reject this and you must use a pre-approved Meta Template instead.
    data = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": full_message
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                logging.info(f"WhatsApp alert sent successfully to {clean_phone}")
                return True
            else:
                logging.error(f"WhatsApp API Error: {response.text}")
                return False
                
    except Exception as e:
        logging.error(f"WhatsApp Service Exception: {str(e)}")
        return False
