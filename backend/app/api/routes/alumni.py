from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Alumni, User
from app.schemas.schemas import AlumniResponse, AlumniCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/alumni", tags=["Alumni"])


@router.get("", response_model=List[AlumniResponse])
def list_alumni(
    department: str = None,
    industry: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alumni)
    if department:
        query = query.filter(Alumni.department == department)
    if industry:
        query = query.filter(Alumni.industry == industry)
    alumni = query.offset(skip).limit(limit).all()
    return [AlumniResponse.model_validate(a) for a in alumni]


@router.get("/{alumni_id}", response_model=AlumniResponse)
def get_alumni(alumni_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.id == alumni_id).first()
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return AlumniResponse.model_validate(alumni)


@router.put("/{alumni_id}", response_model=AlumniResponse)
def update_alumni(alumni_id: int, data: AlumniCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.id == alumni_id).first()
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    if alumni.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(alumni, key, value)
    db.commit()
    db.refresh(alumni)
    return AlumniResponse.model_validate(alumni)
