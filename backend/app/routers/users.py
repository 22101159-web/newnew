from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
import uuid
from ..database import get_db
from ..models.user import User, Event, Message
from ..schemas.user import UserResponse, EventResponse, EventCreate, EventUpdate, MessageResponse, MessageBase

from fastapi.security import OAuth2PasswordBearer
from ..middleware import jwt_handler

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = jwt_handler.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Subject missing in token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.get("/events", response_model=List[EventResponse])
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.createdAt.desc()).all()
    # Manual conversion for statusPhotos string to list
    for e in events:
        e.statusPhotos = json.loads(e.statusPhotos) if e.statusPhotos else []
    return events

@router.post("/events", response_model=EventResponse)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    new_event = Event(
        **event_in.dict(),
        statusPhotos="[]"
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    new_event.statusPhotos = []
    return new_event

@router.put("/events/{event_id}", response_model=EventResponse)
def update_event(event_id: str, event_up: EventUpdate, db: Session = Depends(get_db)):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_up.dict(exclude_unset=True)
    if "statusPhotos" in update_data:
        update_data["statusPhotos"] = json.dumps(update_data["statusPhotos"])
    
    for key, value in update_data.items():
        setattr(db_event, key, value)
    
    db.commit()
    db.refresh(db_event)
    db_event.statusPhotos = json.loads(db_event.statusPhotos)
    return db_event

@router.get("/public/events/{identifier}")
def get_public_event(identifier: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter((Event.id == identifier) | (Event.trackingNumber == identifier)).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.statusPhotos = json.loads(event.statusPhotos)
    return event

@router.post("/public/book")
def public_book(event_in: EventCreate, db: Session = Depends(get_db)):
    # Simple conflict check
    conflict = db.query(Event).filter(Event.eventDate == event_in.eventDate, Event.status != "Cancelled").first()
    if conflict:
        raise HTTPException(status_code=400, detail="Date already booked")
    
    new_event = Event(**event_in.dict(), statusPhotos="[]")
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    new_event.statusPhotos = []
    return new_event

@router.get("/messages/{event_id}", response_model=List[MessageResponse])
def get_messages(event_id: str, db: Session = Depends(get_db)):
    return db.query(Message).filter(Message.eventId == event_id).order_by(Message.timestamp).all()

@router.post("/messages", response_model=MessageResponse)
def create_message(msg_in: MessageBase, db: Session = Depends(get_db)):
    new_msg = Message(
        id=f"msg_{int(uuid.uuid4())}"[:15],
        **msg_in.dict()
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg
