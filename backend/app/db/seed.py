"""
Seed script to populate the database with realistic demo data.
Run: python -m app.db.seed
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.database import SessionLocal, create_tables
from app.models.models import User, Student, Alumni, Job, Event, Mentorship, Donation, AlumniDigitalTwin
from app.core.security import get_password_hash
from datetime import datetime, timezone, timedelta
import random

def seed():
    create_tables()
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(User).count() > 0:
        print("Database already seeded. Skipping.")
        db.close()
        return
    
    print("[SEED] Seeding database with demo data...")
    
    # ===== ADMIN USER =====
    admin = User(email="admin@demo.com", password_hash=get_password_hash("demo123"), full_name="Admin User", role="admin")
    db.add(admin)
    db.flush()
    
    # ===== STUDENTS =====
    student_data = [
        {"name": "Ravi Kumar", "email": "student@demo.com", "dept": "Computer Science", "year": 4, "skills": ["Python", "Machine Learning", "React", "Data Science"], "goals": "AI Engineer", "interests": ["Artificial Intelligence", "Web Development"], "cgpa": 8.5},
        {"name": "Meera Nair", "email": "meera@demo.com", "dept": "Information Technology", "year": 3, "skills": ["Cloud Computing", "AWS", "Docker", "Java"], "goals": "Cloud Architect", "interests": ["Cloud Computing", "DevOps"], "cgpa": 8.2},
        {"name": "Arjun Das", "email": "arjun.d@demo.com", "dept": "Computer Science", "year": 4, "skills": ["Python", "NLP", "TensorFlow", "Statistics"], "goals": "Data Scientist", "interests": ["Data Science", "NLP"], "cgpa": 8.8},
        {"name": "Priya Menon", "email": "priya.m@demo.com", "dept": "Electronics", "year": 3, "skills": ["IoT", "Embedded Systems", "C++", "Arduino"], "goals": "IoT Engineer", "interests": ["IoT", "Embedded Systems"], "cgpa": 7.9},
        {"name": "Karthik Raj", "email": "karthik@demo.com", "dept": "Computer Science", "year": 4, "skills": ["React", "Node.js", "MongoDB", "TypeScript"], "goals": "Full Stack Developer", "interests": ["Web Development", "Startups"], "cgpa": 8.0},
        {"name": "Ananya Sharma", "email": "ananya@demo.com", "dept": "Information Technology", "year": 3, "skills": ["Cyber Security", "Networking", "Linux", "Python"], "goals": "Security Analyst", "interests": ["Cyber Security", "Ethical Hacking"], "cgpa": 8.3},
    ]
    
    students = []
    for s in student_data:
        user = User(email=s["email"], password_hash=get_password_hash("demo123"), full_name=s["name"], role="student")
        db.add(user)
        db.flush()
        student = Student(user_id=user.id, department=s["dept"], year=s["year"], skills=s["skills"], career_goals=s["goals"], interests=s["interests"], cgpa=s["cgpa"])
        db.add(student)
        db.flush()
        students.append(student)
    
    # ===== ALUMNI =====
    alumni_data = [
        {"name": "Dr. Priya Sharma", "email": "alumni@demo.com", "dept": "Computer Science", "year": 2015, "company": "Google DeepMind", "role": "AI Research Lead", "industry": "IT/Software", "skills": ["Machine Learning", "NLP", "Python", "TensorFlow", "Research"], "certs": ["Google ML Professional", "PhD in AI"], "exp": 11, "loc": "Bangalore"},
        {"name": "Rahul Verma", "email": "rahul.v@demo.com", "dept": "Information Technology", "year": 2017, "company": "Microsoft", "role": "Senior SDE", "industry": "IT/Software", "skills": ["Cloud Computing", "React", "TypeScript", "Azure", "System Design"], "certs": ["Azure Solutions Architect", "AWS SAA"], "exp": 9, "loc": "Hyderabad"},
        {"name": "Anita Patel", "email": "anita@demo.com", "dept": "Computer Science", "year": 2018, "company": "Amazon", "role": "Data Scientist", "industry": "Data/AI", "skills": ["Data Science", "Python", "TensorFlow", "Statistics", "SQL"], "certs": ["AWS ML Specialty"], "exp": 8, "loc": "Chennai"},
        {"name": "Vikram Singh", "email": "vikram@demo.com", "dept": "Electronics", "year": 2012, "company": "TechStartup Inc", "role": "CTO & Co-Founder", "industry": "IT/Software", "skills": ["Architecture", "Leadership", "System Design", "AWS", "Python"], "certs": ["Executive MBA"], "exp": 14, "loc": "Mumbai"},
        {"name": "Sneha Gupta", "email": "sneha@demo.com", "dept": "Information Technology", "year": 2016, "company": "Meta", "role": "Product Manager", "industry": "IT/Software", "skills": ["Product Strategy", "UX Research", "Data Analytics", "Agile", "SQL"], "certs": ["PMP", "Certified Scrum Master"], "exp": 10, "loc": "Pune"},
        {"name": "Arjun Reddy", "email": "arjun.r@demo.com", "dept": "Computer Science", "year": 2019, "company": "Google", "role": "Security Engineer", "industry": "IT/Software", "skills": ["Cyber Security", "Penetration Testing", "Cloud Security", "SOC", "Python"], "certs": ["CISSP", "CEH"], "exp": 7, "loc": "Bangalore"},
        {"name": "Deepika Iyer", "email": "deepika@demo.com", "dept": "Computer Science", "year": 2020, "company": "Netflix", "role": "ML Engineer", "industry": "Data/AI", "skills": ["Machine Learning", "Python", "Spark", "Recommendation Systems", "A/B Testing"], "certs": ["Google ML Certificate"], "exp": 6, "loc": "International"},
        {"name": "Suresh Babu", "email": "suresh@demo.com", "dept": "Mechanical", "year": 2014, "company": "Tesla", "role": "Manufacturing Lead", "industry": "Manufacturing", "skills": ["Automation", "Robotics", "Quality Control", "Six Sigma", "CAD"], "certs": ["Six Sigma Black Belt"], "exp": 12, "loc": "International"},
    ]
    
    alumni_list = []
    for a in alumni_data:
        user = User(email=a["email"], password_hash=get_password_hash("demo123"), full_name=a["name"], role="alumni")
        db.add(user)
        db.flush()
        alumnus = Alumni(
            user_id=user.id, graduation_year=a["year"], department=a["dept"],
            current_company=a["company"], designation=a["role"], industry=a["industry"],
            skills=a["skills"], certifications=a["certs"], years_experience=a["exp"],
            location=a["loc"], expertise_score=random.uniform(70, 98),
            engagement_score=random.uniform(60, 95),
        )
        db.add(alumnus)
        db.flush()
        alumni_list.append(alumnus)
        
        # Digital Twin
        twin = AlumniDigitalTwin(
            alumni_id=alumnus.id,
            profile_data={"education": a["dept"], "career": [a["company"]], "certifications": a["certs"]},
            career_timeline=[{"year": a["year"], "event": "Graduated"}, {"year": a["year"] + 1, "event": f"Joined {a['company']}"}],
            expertise_score=alumnus.expertise_score,
            engagement_score=alumnus.engagement_score,
            industry_category=a["industry"],
        )
        db.add(twin)
    
    # ===== JOBS =====
    jobs_data = [
        {"title": "Machine Learning Engineer Intern", "company": "Google", "loc": "Bangalore", "type": "Internship", "desc": "Work on cutting-edge ML models for search optimization.", "skills": ["Python", "TensorFlow", "Machine Learning"]},
        {"title": "Full Stack Developer", "company": "Microsoft", "loc": "Hyderabad", "type": "Full-time", "desc": "Build cloud-native applications with React and Azure.", "skills": ["React", "Node.js", "Azure", "TypeScript"]},
        {"title": "Data Science Intern", "company": "Amazon", "loc": "Chennai", "type": "Internship", "desc": "Analyze large datasets and build predictive models.", "skills": ["Python", "Statistics", "SQL", "Data Science"]},
        {"title": "Cloud Solutions Architect", "company": "AWS", "loc": "Mumbai", "type": "Full-time", "desc": "Design and implement cloud infrastructure solutions.", "skills": ["AWS", "Terraform", "Docker", "Kubernetes"]},
        {"title": "Cybersecurity Analyst", "company": "Deloitte", "loc": "Pune", "type": "Full-time", "desc": "Protect enterprise systems from cyber threats.", "skills": ["Cyber Security", "SIEM", "Networking", "Incident Response"]},
        {"title": "AI Research Assistant", "company": "IIT Research Lab", "loc": "Remote", "type": "Part-time", "desc": "Assist in NLP and computer vision research projects.", "skills": ["Python", "NLP", "Research", "Deep Learning"]},
    ]
    
    for i, j in enumerate(jobs_data):
        job = Job(
            alumni_id=alumni_list[i % len(alumni_list)].id if i < len(alumni_list) else None,
            title=j["title"], company=j["company"], location=j["loc"],
            type=j["type"], description=j["desc"], skills_required=j["skills"],
        )
        db.add(job)
    
    # ===== EVENTS =====
    now = datetime.now(timezone.utc)
    events_data = [
        {"title": "AI & Machine Learning Workshop", "desc": "Hands-on workshop on building ML models.", "type": "Workshop", "days": 6},
        {"title": "Alumni Networking Meetup 2026", "desc": "Annual networking event for alumni and students.", "type": "Networking", "days": 22},
        {"title": "Industry Talk: Cloud Architecture", "desc": "Modern cloud architecture patterns from experts.", "type": "Webinar", "days": 11},
        {"title": "Smart India Hackathon Prep", "desc": "Practice hackathon for SIH preparation.", "type": "Hackathon", "days": 32},
        {"title": "Career Guidance Seminar", "desc": "Alumni-led career planning session.", "type": "Seminar", "days": 27},
    ]
    
    for e in events_data:
        event = Event(
            title=e["title"], description=e["desc"], type=e["type"],
            date=now + timedelta(days=e["days"]),
            time="10:00 AM - 4:00 PM", location="Campus",
            organizer_id=admin.id, max_participants=100,
        )
        db.add(event)
    
    # ===== MENTORSHIPS =====
    mentorships = [
        (0, 0, "accepted", 94, "Strong ML and Python skills overlap. Both from CS department."),
        (1, 1, "accepted", 88, "Cloud computing and DevOps interests align."),
        (2, 2, "pending", 82, "Data Science and NLP skills match."),
        (3, 3, "pending", 76, "IoT and embedded systems expertise."),
    ]
    
    for ai_idx, si_idx, status, score, explanation in mentorships:
        m = Mentorship(
            alumni_id=alumni_list[ai_idx].id, student_id=students[si_idx].id,
            status=status, match_score=score, match_explanation=explanation,
        )
        db.add(m)
    
    # ===== DONATIONS =====
    for i, alumnus in enumerate(alumni_list[:4]):
        donation = Donation(
            alumni_id=alumnus.id,
            amount=random.choice([5000, 10000, 25000, 50000, 100000]),
            purpose=random.choice(["Scholarship Fund", "Lab Equipment", "Library", "General"]),
        )
        db.add(donation)
    
    db.commit()
    db.close()
    print("[OK] Database seeded successfully!")
    print("   Demo accounts: student@demo.com / alumni@demo.com / admin@demo.com (password: demo123)")


if __name__ == "__main__":
    seed()
