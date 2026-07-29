from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Event, EventRegistration, User
from app.schemas.schemas import EventCreate, EventResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[EventResponse])
def list_events(
    type: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Event).filter(Event.is_active == True)
    if type:
        query = query.filter(Event.type == type)
    events = query.order_by(Event.date.desc()).offset(skip).limit(limit).all()
    return [EventResponse.model_validate(e) for e in events]


@router.post("", response_model=EventResponse)
def create_event(data: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = Event(
        title=data.title,
        description=data.description,
        date=data.date,
        time=data.time,
        location=data.location,
        type=data.type,
        organizer_id=current_user.id,
        max_participants=data.max_participants,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventResponse.model_validate(event)


@router.post("/{event_id}/register")
def register_for_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    
    reg = EventRegistration(event_id=event_id, user_id=current_user.id)
    db.add(reg)
    db.commit()
    return {"message": "Registered successfully"}
