from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    alumni = "alumni"
    faculty = "faculty"
    admin = "admin"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False)
    alumni_profile = relationship("Alumni", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")


class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    enrollment_no = Column(String(50), unique=True)
    department = Column(String(100))
    year = Column(Integer)
    skills = Column(JSON, default=list)
    career_goals = Column(Text)
    interests = Column(JSON, default=list)
    cgpa = Column(Float)
    resume_url = Column(String(500))
    
    user = relationship("User", back_populates="student_profile")
    mentorships = relationship("Mentorship", back_populates="student")
    feedback = relationship("Feedback", back_populates="user_student")


class Alumni(Base):
    __tablename__ = "alumni"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    graduation_year = Column(Integer)
    department = Column(String(100))
    current_company = Column(String(255))
    designation = Column(String(255))
    industry = Column(String(100))
    skills = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    achievements = Column(JSON, default=list)
    linkedin_url = Column(String(500))
    years_experience = Column(Integer, default=0)
    location = Column(String(255))
    expertise_score = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="alumni_profile")
    mentorships = relationship("Mentorship", back_populates="alumni")
    jobs = relationship("Job", back_populates="alumni")
    donations = relationship("Donation", back_populates="alumni")
    digital_twin = relationship("AlumniDigitalTwin", back_populates="alumni", uselist=False)


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    alumni_id = Column(Integer, ForeignKey("alumni.id"))
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255))
    type = Column(String(50))  # Internship, Full-time, Part-time
    description = Column(Text)
    skills_required = Column(JSON, default=list)
    requirements = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    alumni = relationship("Alumni", back_populates="jobs")


class Mentorship(Base):
    __tablename__ = "mentorships"
    
    id = Column(Integer, primary_key=True, index=True)
    alumni_id = Column(Integer, ForeignKey("alumni.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, declined, completed
    match_score = Column(Float, default=0.0)
    match_explanation = Column(Text)
    start_date = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    alumni = relationship("Alumni", back_populates="mentorships")
    student = relationship("Student", back_populates="mentorships")


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    date = Column(DateTime, nullable=False)
    time = Column(String(50))
    location = Column(String(255))
    type = Column(String(50))  # Workshop, Webinar, Networking, Hackathon, Seminar
    organizer_id = Column(Integer, ForeignKey("users.id"))
    max_participants = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    registrations = relationship("EventRegistration", back_populates="event")


class EventRegistration(Base):
    __tablename__ = "event_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="registered")
    attended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    event = relationship("Event", back_populates="registrations")


class Donation(Base):
    __tablename__ = "donations"
    
    id = Column(Integer, primary_key=True, index=True)
    alumni_id = Column(Integer, ForeignKey("alumni.id"), nullable=False)
    amount = Column(Float, nullable=False)
    purpose = Column(String(255))
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    alumni = relationship("Alumni", back_populates="donations")


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50))  # mentor, job, event
    content = Column(JSON)
    explanation = Column(Text)
    score = Column(Float)
    feedback_rating = Column(Float)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"))
    rating = Column(Integer)  # 1-5
    comment = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user_student = relationship("Student", back_populates="feedback")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="notifications")


class AlumniDigitalTwin(Base):
    __tablename__ = "alumni_digital_twins"
    
    id = Column(Integer, primary_key=True, index=True)
    alumni_id = Column(Integer, ForeignKey("alumni.id"), unique=True, nullable=False)
    profile_data = Column(JSON, default=dict)
    career_timeline = Column(JSON, default=list)
    expertise_score = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0)
    networking_score = Column(Float, default=0.0)
    industry_category = Column(String(100))
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    alumni = relationship("Alumni", back_populates="digital_twin")
