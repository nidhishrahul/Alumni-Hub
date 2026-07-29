from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# === Auth Schemas ===
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# === Student Schemas ===
class StudentCreate(BaseModel):
    enrollment_no: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    skills: List[str] = []
    career_goals: Optional[str] = None
    interests: List[str] = []
    cgpa: Optional[float] = None

class StudentResponse(BaseModel):
    id: int
    user_id: int
    enrollment_no: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    skills: List[str] = []
    career_goals: Optional[str] = None
    interests: List[str] = []
    cgpa: Optional[float] = None
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True


# === Alumni Schemas ===
class AlumniCreate(BaseModel):
    graduation_year: Optional[int] = None
    department: Optional[str] = None
    current_company: Optional[str] = None
    designation: Optional[str] = None
    industry: Optional[str] = None
    skills: List[str] = []
    certifications: List[str] = []
    linkedin_url: Optional[str] = None
    years_experience: int = 0
    location: Optional[str] = None

class AlumniResponse(BaseModel):
    id: int
    user_id: int
    graduation_year: Optional[int] = None
    department: Optional[str] = None
    current_company: Optional[str] = None
    designation: Optional[str] = None
    industry: Optional[str] = None
    skills: List[str] = []
    certifications: List[str] = []
    expertise_score: float = 0.0
    engagement_score: float = 0.0
    location: Optional[str] = None
    years_experience: int = 0
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True


# === Job Schemas ===
class JobCreate(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    type: str = "Internship"
    description: Optional[str] = None
    skills_required: List[str] = []
    requirements: Optional[str] = None

class JobResponse(BaseModel):
    id: int
    alumni_id: Optional[int] = None
    title: str
    company: str
    location: Optional[str] = None
    type: str
    description: Optional[str] = None
    skills_required: List[str] = []
    is_active: bool = True
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# === Mentorship Schemas ===
class MentorshipRequest(BaseModel):
    alumni_id: int
    message: Optional[str] = None

class MentorshipResponse(BaseModel):
    id: int
    alumni_id: int
    student_id: int
    status: str
    match_score: float
    match_explanation: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# === Event Schemas ===
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    time: Optional[str] = None
    location: Optional[str] = None
    type: str = "Workshop"
    max_participants: int = 100

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    date: datetime
    time: Optional[str] = None
    location: Optional[str] = None
    type: str
    max_participants: int
    is_active: bool
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# === Analytics Schemas ===
class DashboardStats(BaseModel):
    total_alumni: int
    total_students: int
    active_mentorships: int
    total_jobs: int
    total_events: int

class PlacementTrend(BaseModel):
    year: str
    placed: int

class IndustryDistribution(BaseModel):
    name: str
    value: int


# === AI Schemas ===
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    agent: str = "communication_assistant"

class MentorRecommendation(BaseModel):
    alumni_id: int
    name: str
    company: str
    designation: str
    match_score: float
    match_explanation: str
    skills: List[str]
