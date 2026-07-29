from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Job, Alumni, User
from app.schemas.schemas import JobCreate, JobResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobResponse])
def list_jobs(
    type: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Job).filter(Job.is_active == True)
    if type:
        query = query.filter(Job.type == type)
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return [JobResponse.model_validate(j) for j in jobs]


@router.post("", response_model=JobResponse)
def create_job(data: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["alumni", "admin"]:
        raise HTTPException(status_code=403, detail="Only alumni can post jobs")
    
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.id).first()
    
    job = Job(
        alumni_id=alumni.id if alumni else None,
        title=data.title,
        company=data.company,
        location=data.location,
        type=data.type,
        description=data.description,
        skills_required=data.skills_required,
        requirements=data.requirements,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return JobResponse.model_validate(job)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)
