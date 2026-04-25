from sqlalchemy import Column, Integer, String, LargeBinary
from ..database import Base

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content_type = Column(String)
    data = Column(LargeBinary)
