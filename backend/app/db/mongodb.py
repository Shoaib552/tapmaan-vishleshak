from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        # Verify connection
        await db.client.admin.command('ping')
        db.db = db.client.get_default_database()
        logging.info("Successfully connected to MongoDB Atlas")
    except Exception as e:
        logging.error(f"Could not connect to MongoDB: {e}")
        # Don't raise here, allow the app to start but log the error
        # This helps see the error in the console

async def close_mongo_connection():
    if db.client:
        db.client.close()
        logging.info("Closed MongoDB connection")

def get_database():
    return db.db
