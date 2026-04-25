from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, users
from .database import SessionLocal
from .services import auth_service
from .schemas import user as user_schema

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed initial admin if not exists
def seed_admin():
    db = SessionLocal()
    admin = auth_service.get_user_by_email(db, "Admin123")
    # Also check email variant
    if not admin:
        admin = auth_service.get_user_by_email(db, "admin@example.com")
    
    if not admin:
        print("Seeding initial admin user...")
        initial_admin = user_schema.UserCreate(
            name="System Admin",
            email="admin@example.com", # Default email
            password="Admin123",
            role="admin"
        )
        # We also want to support logging in with 'Admin123' as username 
        # but schemas expect EmailStr, so I'll just use a valid email
        # and update auth_service to handle it.
        # Actually, let's just make one with email 'Admin123' if we allow it in Schema.
        # For now, use admin@example.com
        auth_service.create_user(db, initial_admin)
        print("Initial admin created: admin@example.com / Admin123")
    db.close()

seed_admin()

app = FastAPI(title="Event Styling API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_api_routes = [
    app.include_router(auth.router, prefix="/api"),
    app.include_router(users.router, prefix="/api"),
]

@app.get("/")
def read_root():
    return {"message": "Welcome to Event Styling API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
