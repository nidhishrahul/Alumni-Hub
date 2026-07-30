"""
AI-Based Alumni Verification Microservice

FastAPI service on port 5050 that receives alumni profile data,
runs it through the Random Forest verification model,
and returns a risk score + classification + feature breakdown.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from ml_model import VerificationModel

app = FastAPI(
    title="Alumni Verification AI Service",
    version="1.0.0",
    description="ML-powered alumni verification risk scoring",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model at startup (trains on synthetic data)
model = VerificationModel()


# ─── Request / Response Schemas ──────────────────────────────────────────────

class DbRecord(BaseModel):
    """University database record for cross-verification."""
    name: Optional[str] = None
    department: Optional[str] = None
    degree: Optional[str] = None
    graduationYear: Optional[int] = None
    registerNumber: Optional[str] = None


class VerifyRequest(BaseModel):
    """Alumni data submitted during registration."""
    name: str
    email: Optional[str] = None
    department: Optional[str] = None
    degree: Optional[str] = None
    graduationYear: Optional[int] = None
    registerNumber: Optional[str] = None
    linkedinUrl: Optional[str] = None
    currentCompany: Optional[str] = None
    currentDesignation: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    interests: Optional[str] = None
    phone: Optional[str] = None
    profilePhotoUrl: Optional[str] = None
    dbRecords: Optional[DbRecord] = None


class VerifyResponse(BaseModel):
    riskScore: float
    classification: str
    features: dict
    fraudProbability: float


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Alumni Verification AI",
        "model": "RandomForest",
        "features": model.FEATURE_NAMES,
    }


@app.post("/verify", response_model=VerifyResponse)
def verify_alumni(request: VerifyRequest):
    """
    Run ML verification pipeline on submitted alumni data.
    Returns a risk score (0-100), classification (LOW/MEDIUM/HIGH_RISK),
    feature breakdown, and raw fraud probability.
    """
    try:
        submitted = request.model_dump(exclude={"dbRecords"})
        db_record = request.dbRecords.model_dump() if request.dbRecords else None

        result = model.predict_risk(submitted, db_record)
        return VerifyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5050, log_level="info")
