from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    name: str
    email: str
    role: str = "client"

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    createdAt: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class EventBase(BaseModel):
    trackingNumber: str
    clientName: str
    eventType: str
    eventDate: Optional[str] = None
    venue: Optional[str] = None
    status: str = "Booked"

class EventCreate(EventBase):
    id: str

class EventUpdate(BaseModel):
    status: Optional[str] = None
    statusPhotos: Optional[List[str]] = None
    clientName: Optional[str] = None
    eventType: Optional[str] = None
    eventDate: Optional[str] = None
    venue: Optional[str] = None

class EventResponse(EventBase):
    id: str
    statusPhotos: List[str]
    createdAt: datetime

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    eventId: str
    text: str
    senderName: str
    senderRole: str

class MessageResponse(MessageBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True
