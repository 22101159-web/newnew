import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models.user import User
from .models.image import Image
from .models.app_data import AppData
from .routers.auth import router as auth_router
from .routers.users import router as users_router
from .routers.upload import router as upload_router
from .routers.app_data import router as app_data_router
from .services.auth_service import get_password_hash

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EMI System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(upload_router)
app.include_router(app_data_router, prefix="/api/data")

@app.on_event("startup")
def startup_event():
    logger.info("Starting up EMI API")
    db = SessionLocal()
    try:
        from sqlalchemy import func
        admin = db.query(User).filter(func.lower(User.username) == "admin123").first()
        if not admin:
            logger.info("Admin user not found. Creating default admin.")
            hashed_pw = get_password_hash("Admin123")
            default_admin = User(
                username="Admin123",
                email="admin@system.local",
                hashed_password=hashed_pw,
                role="admin"
            )
            db.add(default_admin)
            db.commit()
            logger.info("Default admin created successfully.")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

import os
from fastapi.responses import FileResponse
from fastapi import UploadFile, File

@app.get("/api/backup/download")
def download_backup():
    db_path = "./sql_app.db"
    if os.path.exists(db_path):
        return FileResponse(db_path, media_type='application/octet-stream', filename="sql_app.db")
    return {"error": "Database file not found"}

@app.post("/api/backup/upload")
async def upload_backup(file: UploadFile = File(...)):
    db_path = "./sql_app.db"
    with open(db_path, "wb") as buffer:
        buffer.write(await file.read())
    return {"status": "success", "message": "Database replaced successfully"}
