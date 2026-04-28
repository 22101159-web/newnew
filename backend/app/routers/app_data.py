from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
from ..database import get_db
from ..models.app_data import AppData
from ..models.user import User

router = APIRouter()

class AppDataPayload(BaseModel):
    value: str

class AppDataResponse(BaseModel):
    key: str
    value: str

@router.get("/{key}", response_model=AppDataResponse)
def get_app_data(key: str, db: Session = Depends(get_db)):
    data = db.query(AppData).filter(AppData.key == key).first()
    if not data:
        return AppDataResponse(key=key, value="null")
    return AppDataResponse(key=key, value=data.value)

@router.post("/{key}", response_model=AppDataResponse)
def set_app_data(key: str, payload: AppDataPayload, db: Session = Depends(get_db)):
    data = db.query(AppData).filter(AppData.key == key).first()
    if data:
        data.value = payload.value
    else:
        data = AppData(key=key, value=payload.value)
        db.add(data)
    db.commit()
    db.refresh(data)
    return AppDataResponse(key=key, value=data.value)
