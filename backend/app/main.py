import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models.user import User
from .models.image import Image
from .routers.auth import router as auth_router
from .routers.users import router as users_router
from .routers.upload import router as upload_router
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(upload_router)

@app.on_event("startup")
def startup_event():
    logger.info("Starting up EMI API")
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "Admin123").first()
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
