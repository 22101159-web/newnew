from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import user as user_model
from ..schemas import user as user_schema
from .auth import oauth2_scheme
from ..middleware import jwt_handler

router = APIRouter(prefix="/users", tags=["users"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = jwt_handler.decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(user_model.User).filter(user_model.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

def check_admin(user: user_model.User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return user

@router.get("/me", response_model=user_schema.User)
def read_users_me(current_user: user_model.User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[user_schema.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    admin: user_model.User = Depends(check_admin)
):
    users = db.query(user_model.User).offset(skip).limit(limit).all()
    return users

@router.put("/{user_id}", response_model=user_schema.User)
def update_user(
    user_id: int, 
    user_update: user_schema.UserUpdate, 
    db: Session = Depends(get_db),
    admin: user_model.User = Depends(check_admin)
):
    db_user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        from ..services import auth_service
        update_data["hashed_password"] = auth_service.get_password_hash(update_data.pop("password"))
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    admin: user_model.User = Depends(check_admin)
):
    db_user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}
