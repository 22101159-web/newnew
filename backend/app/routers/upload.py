from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import Response
from ..database import get_db
from ..models.image import Image

router = APIRouter(
    prefix="/api/upload",
    tags=["upload"]
)

@router.post("/")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    data = await file.read()
    db_image = Image(
        filename=file.filename,
        content_type=file.content_type or "image/jpeg",
        data=data
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return {"url": f"/api/upload/{db_image.id}"}

@router.get("/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db)):
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=db_image.data, media_type=db_image.content_type)
