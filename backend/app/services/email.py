from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
from pydantic import EmailStr
from typing import List

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=465,           # Port 465 (SSL) — port 587 (STARTTLS) is blocked by Render
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=False,     # Must be False when using SSL
    MAIL_SSL_TLS=True,       # Use SSL instead of STARTTLS
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_alert_email(email_list: List[EmailStr], alert_type: str, location: str, message: str):
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        print(f"Skipping email (not configured) to {email_list}: {alert_type} in {location}")
        return

    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #721c24; margin-top: 0;">⚠️ CRITICAL ALERT: {alert_type}</h2>
                <p><strong>Location:</strong> {location}</p>
                <p><strong>Message:</strong> {message}</p>
            </div>
            <p>Please stay safe and follow local authority guidelines.</p>
            <hr>
            <p style="font-size: 0.8em; color: #666;">This is an automated message from Tapmaan Vishleshak Alert System.</p>
        </body>
    </html>
    """

    message_schema = MessageSchema(
        subject=f"URGENT: {alert_type} Alert for {location}",
        recipients=email_list,
        body=html,
        subtype=MessageType.html
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message_schema)
    except Exception as e:
        # Log the error but don't crash — WhatsApp alert will still be sent
        print(f"Email send failed (non-critical): {str(e)}")
