from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User, Alumni, Student, Mentorship
from app.schemas.schemas import ChatMessage, ChatResponse, MentorRecommendation
from app.api.deps import get_current_user
from typing import List

router = APIRouter(prefix="/ai", tags=["AI"])


def get_mentor_recommendations(student, alumni_list):
    """Simple cosine similarity-based mentor matching (demo version)."""
    recommendations = []
    student_skills = set(student.skills or [])
    student_interests = set(student.interests or [])
    
    for alumni in alumni_list:
        alumni_skills = set(alumni.skills or [])
        
        # Skill overlap score
        if student_skills and alumni_skills:
            overlap = len(student_skills & alumni_skills)
            union = len(student_skills | alumni_skills)
            skill_score = (overlap / union * 100) if union > 0 else 0
        else:
            skill_score = 50  # Default score
        
        # Department match bonus
        dept_bonus = 10 if alumni.department == student.department else 0
        
        # Experience bonus
        exp_bonus = min(alumni.years_experience or 0, 10)
        
        match_score = min(round(skill_score + dept_bonus + exp_bonus, 1), 100)
        
        # Generate explanation
        shared = list(student_skills & alumni_skills)[:3]
        explanation = f"Matched on skills: {', '.join(shared) if shared else 'general expertise'}. "
        if alumni.department == student.department:
            explanation += f"Both from {alumni.department} department. "
        if alumni.years_experience and alumni.years_experience > 5:
            explanation += f"{alumni.years_experience} years of industry experience."
        
        recommendations.append(MentorRecommendation(
            alumni_id=alumni.id,
            name=alumni.user.full_name if alumni.user else "Unknown",
            company=alumni.current_company or "Unknown",
            designation=alumni.designation or "Professional",
            match_score=match_score,
            match_explanation=explanation,
            skills=list(alumni_skills)[:5],
        ))
    
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    return recommendations[:10]


@router.get("/mentorship/match/{student_id}", response_model=List[MentorRecommendation])
def match_mentors(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return []
    
    alumni_list = db.query(Alumni).all()
    return get_mentor_recommendations(student, alumni_list)


@router.post("/chat", response_model=ChatResponse)
def chat(message: ChatMessage, current_user: User = Depends(get_current_user)):
    """Simple rule-based chatbot (demo version - replace with LLM in production)."""
    msg = message.message.lower()
    
    if any(w in msg for w in ["mentor", "guide", "help me learn"]):
        response = ("I can help you find the perfect mentor! Based on your profile, I'll use our "
                     "Smart Mentorship Matching Agent to find alumni who share your skills and interests. "
                     "Navigate to the 'Find Mentors' page to see AI-matched recommendations with XAI explanations.")
    elif any(w in msg for w in ["job", "intern", "opportunity", "career", "work"]):
        response = ("Our Career Opportunity Agent analyzes your skills and matches them with available positions. "
                     "Check the Job Portal for AI-matched opportunities with explainable reasons for each match. "
                     "Some positions also have alumni referral pathways available!")
    elif any(w in msg for w in ["event", "workshop", "seminar", "hackathon"]):
        response = ("I can recommend events based on your interests and career goals. "
                     "Visit the Events page to see upcoming activities with AI-predicted attendance scores. "
                     "Our system analyzes your preferences to suggest the most relevant events.")
    elif any(w in msg for w in ["analytic", "stat", "data", "insight", "trend"]):
        response = ("Our Analytics Intelligence Agent provides comprehensive institutional insights including "
                     "placement trends, salary distribution, industry analysis, and geographic distribution. "
                     "Admin users can access the full analytics dashboard.")
    elif any(w in msg for w in ["hello", "hi", "hey", "greet"]):
        response = (f"Hello {current_user.full_name}! 👋 Welcome to AlumniConnect AI. "
                     "I'm powered by 6 specialized AI agents and can help you with mentorship, "
                     "jobs, events, and analytics. What would you like to explore?")
    else:
        response = ("I'm your AI-powered assistant for AlumniConnect. I can help with:\n\n"
                     "🎓 Finding mentors matched to your profile\n"
                     "💼 Discovering job and internship opportunities\n"
                     "📅 Recommending relevant events\n"
                     "📊 Providing career analytics and insights\n\n"
                     "Try asking: 'Find me a mentor in AI' or 'What internships match my profile?'")
    
    return ChatResponse(response=response)
