from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.models import User, Student, Alumni, Job, Mentorship, Event, Donation
from app.schemas.schemas import DashboardStats
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardStats(
        total_alumni=db.query(Alumni).count(),
        total_students=db.query(Student).count(),
        active_mentorships=db.query(Mentorship).filter(Mentorship.status == "accepted").count(),
        total_jobs=db.query(Job).filter(Job.is_active == True).count(),
        total_events=db.query(Event).filter(Event.is_active == True).count(),
    )


@router.get("/placement-trends")
def get_placement_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Aggregate alumni by graduation year
    results = db.query(
        Alumni.graduation_year,
        func.count(Alumni.id).label("count")
    ).group_by(Alumni.graduation_year).order_by(Alumni.graduation_year).all()
    
    return [{"year": str(r.graduation_year), "count": r.count} for r in results if r.graduation_year]


@router.get("/alumni-distribution")
def get_alumni_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # By department
    dept_results = db.query(
        Alumni.department,
        func.count(Alumni.id).label("count")
    ).group_by(Alumni.department).all()
    
    # By industry
    industry_results = db.query(
        Alumni.industry,
        func.count(Alumni.id).label("count")
    ).group_by(Alumni.industry).all()
    
    return {
        "by_department": [{"name": r.department or "Unknown", "value": r.count} for r in dept_results],
        "by_industry": [{"name": r.industry or "Unknown", "value": r.count} for r in industry_results],
    }


@router.get("/engagement")
def get_engagement_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_alumni = db.query(Alumni).count() or 1
    mentoring_alumni = db.query(Mentorship.alumni_id).distinct().count()
    donating_alumni = db.query(Donation.alumni_id).distinct().count()
    
    return {
        "mentoring_rate": round(mentoring_alumni / total_alumni * 100, 1),
        "donation_rate": round(donating_alumni / total_alumni * 100, 1),
        "total_donations": db.query(func.sum(Donation.amount)).scalar() or 0,
        "avg_engagement_score": db.query(func.avg(Alumni.engagement_score)).scalar() or 0,
    }
