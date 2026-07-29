# AlumniConnect AI

**Multi-Agent AI-Powered Alumni Intelligence & Engagement Platform**

A centralized alumni data management system powered by 6 AI agents for intelligent mentorship matching, career recommendations, engagement prediction, and institutional analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.10+
- pip

### Frontend (React + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:3000

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m app.db.seed          # Seed demo data
uvicorn app.main:app --reload  # Start server
```
Backend runs at: http://localhost:8000
API Docs at: http://localhost:8000/api/docs

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.com | demo123 |
| Alumni | alumni@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

## 🏗️ Architecture

```
Student / Alumni / Faculty / Admin
          ↓
   React Web Portal (Tailwind CSS)
          ↓
   FastAPI Backend (JWT + RBAC)
          ↓
   AI Orchestration Layer
          ↓
┌─────────────────────────────────────────┐
│ Alumni Intelligence Agent               │
│ Smart Mentorship Matching Agent         │
│ Career Opportunity Agent                │
│ Alumni Engagement Agent                 │
│ AI Communication Assistant              │
│ Alumni Analytics Agent                  │
└─────────────────────────────────────────┘
          ↓
  Explainable Recommendation Engine (XAI)
          ↓
  SQLite / PostgreSQL Database
```

## 🤖 AI Agents

| Agent | Purpose | Technique |
|-------|---------|-----------|
| Alumni Intelligence | Expertise scoring, career timeline | Random Forest, XGBoost |
| Mentorship Matching | Student-alumni matching | NLP, Cosine Similarity |
| Career Opportunity | Job/internship recommendations | Skill Embeddings, TF-IDF |
| Engagement Prediction | Participation forecasting | Gradient Boosting |
| Communication Assistant | AI chatbot | LLM, RAG Pipeline |
| Analytics Agent | Institutional insights | Time-Series, Aggregation |

## 🌟 Novel Features

- **Explainable AI (XAI)** — SHAP-value explanations for every recommendation
- **Alumni Digital Twin** — Virtual profiles that evolve with AI
- **Adaptive Learning** — System improves from user feedback
- **Social Network Graph** — NetworkX alumni relationship mapping
- **Predictive Analytics** — Placement trend and engagement forecasting
- **Intelligent Fundraising** — Donation probability prediction

## 📂 Project Structure

```
Alumni-Hub/
├── frontend/           # React + Tailwind CSS
│   ├── src/
│   │   ├── components/ # Layout, UI components
│   │   ├── pages/      # All route pages
│   │   ├── context/    # Auth context
│   │   └── services/   # API client
├── backend/            # FastAPI
│   ├── app/
│   │   ├── api/        # REST API routes
│   │   ├── core/       # Config, security
│   │   ├── models/     # SQLAlchemy ORM
│   │   ├── schemas/    # Pydantic validators
│   │   └── db/         # Database, seed
├── ai_engine/          # ML/AI Pipeline
│   ├── agents/         # 6 AI agents
│   ├── explainability/ # SHAP utilities
│   └── graph/          # NetworkX analysis
└── docs/               # Documentation
```

## 🔐 Security

- JWT Authentication with refresh tokens
- Role-Based Access Control (RBAC)
- Bcrypt password hashing
- Input validation (Pydantic)
- CORS protection

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS, Recharts, Lucide Icons |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ML/AI | scikit-learn, Sentence Transformers, SHAP, NetworkX |
| Auth | JWT (python-jose), bcrypt |

## 📜 License

MIT License — Built as a B.Tech Final Year Project
