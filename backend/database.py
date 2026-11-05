import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "student_prediction"

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        await client.admin.command('ping')
        db = client[DATABASE_NAME]
        logger.info("✅ MongoDB connected successfully!")
        await ensure_indexes()
        return db
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        return None

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("🔌 MongoDB connection closed")

async def ensure_indexes():
    if db is None:
        return
    try:
        await db["predictions"].create_index("student_id")
        await db["predictions"].create_index([("created_at", -1)])
        await db["students"].create_index("student_id", unique=True)
        logger.info("✅ Indexes created")
    except Exception as e:
        logger.error(f"❌ Index creation failed: {e}")

async def save_student(student_id: str, name: str):
    if db is None:
        await connect_to_mongo()
    collection = db["students"]
    result = await collection.update_one(
        {"student_id": student_id},
        {"$set": {"name": name, "updated_at": datetime.now()}},
        upsert=True
    )
    return result

async def save_prediction_result(student_id: str, form_data: dict, predicted_score: float):
    if db is None:
        await connect_to_mongo()
    collection = db["predictions"]
    result_data = {
        "student_id": student_id,
        "input_data": form_data,
        "predicted_score": predicted_score,
        "created_at": datetime.now()
    }
    result = await collection.insert_one(result_data)
    return result

async def get_previous_result(student_id: str):
    if db is None:
        await connect_to_mongo()
    collection = db["predictions"]
    previous = await collection.find_one(
        {"student_id": student_id},
        sort=[("created_at", -1)]
    )
    return previous