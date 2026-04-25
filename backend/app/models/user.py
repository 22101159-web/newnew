from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="client")
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class Event(Base):
    __tablename__ = "events"
    id = Column(String, primary_key=True, index=True)
    trackingNumber = Column(String, index=True)
    clientName = Column(String)
    eventType = Column(String)
    eventDate = Column(String)
    venue = Column(String)
    status = Column(String, default="Booked")
    statusPhotos = Column(Text, default="[]") # Stored as JSON string
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, index=True)
    eventId = Column(String, index=True)
    text = Column(Text)
    senderName = Column(String)
    senderRole = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
