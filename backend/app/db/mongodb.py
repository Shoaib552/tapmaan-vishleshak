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
        
        # Explicitly set the database name from the URL or fallback to 'tapmaan'
        db_name = settings.MONGODB_URL.split('/')[-1].split('?')[0] or 'tapmaan'
        db.db = db.client[db_name]
        
        logging.info(f"Successfully connected to MongoDB Atlas (Database: {db_name})")
    except Exception as e:
        logging.error(f"Could not connect to MongoDB: {e}")
        db.db = None
        # Don't raise here, allow the app to start but log the error
        # This helps see the error in the console

async def close_mongo_connection():
    if db.client:
        db.client.close()
        logging.info("Closed MongoDB connection")

def get_database():
    return db.db
