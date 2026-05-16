from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tapmaan Vishleshak Backend"
    MONGODB_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: Optional[str] = None
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Tapmaan Alerts"
    
    # Weather API
    OPENWEATHER_API_KEY: Optional[str] = None
    
    # WhatsApp Cloud API
    WHATSAPP_TOKEN: Optional[str] = None
    WHATSAPP_PHONE_ID: Optional[str] = None

    # Groq API
    GROQ_API_KEY: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()
