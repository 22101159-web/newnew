from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models.user import User
from .routers import auth, users
from .services import auth_service
import uuid

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EMIS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed Admin User
def seed_admin():
    db = SessionLocal()
    try:
        admin_email = "admin@example.com"
        exists = auth_service.get_user_by_email(db, admin_email)
        if not exists:
            admin = User(
                id=str(uuid.uuid4()),
                name="Admin123",
                email=admin_email,
                password=auth_service.get_password_hash("Admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("Admin user seeded (Admin123 / Admin123).")
    finally:
        db.close()

seed_admin()

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users & Events"])

@app.get("/")
def read_root():
    return {"status": "Backend is running with Python FastAPI"}
