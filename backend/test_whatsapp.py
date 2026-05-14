import asyncio
from app.services.whatsapp import send_whatsapp_alert
import logging

logging.basicConfig(level=logging.INFO)

async def test_whatsapp():
    phone_number = "+918299152270"  # Your number from the database
    print(f"Testing WhatsApp message to {phone_number}...")
    
    success = await send_whatsapp_alert(
        phone_number=phone_number,
        alert_type="Test Alert",
        location="Delhi",
        message="This is a test message to verify WhatsApp integration."
    )
    
    if success:
        print("✅ SUCCESS: WhatsApp message sent! Check your phone.")
    else:
        print("❌ FAILED: Could not send WhatsApp message. Check the logs above for the Meta API error.")

if __name__ == "__main__":
    asyncio.run(test_whatsapp())
