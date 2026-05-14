import asyncio
from app.db.mongodb import get_database, connect_to_mongo, close_mongo_connection
import logging

async def check_user_data():
    await connect_to_mongo()
    db = get_database()
    
    user = await db.users.find_one({"email": "smohdshoaib208@gmail.com"})
    
    if user:
        print("\n--- USER DATA FOUND ---")
        for key, value in user.items():
            if key != "hashed_password": # Don't print the password
                print(f"{key}: {value}")
    else:
        print("\n--- USER NOT FOUND ---")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_user_data())
