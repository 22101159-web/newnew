from sqlalchemy import Column, Integer, String, Text
from ..database import Base

class AppData(Base):
    __tablename__ = "app_data"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text)
