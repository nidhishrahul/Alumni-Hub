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
    resumeText: Optional[str] = None
    profilePhotoUrl: Optional[str] = None
    imageFilePath: Optional[str] = None
    dbRecords: Optional[DbRecord] = None


class VerifyResponse(BaseModel):
    riskScore: float
    classification: str
    features: dict
    fraudProbability: float
    extractedCollegeDetails: Optional[dict] = None
    ocrExtractedText: Optional[str] = None


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Alumni Verification AI",
        "model": "RandomForest",
        "features": model.FEATURE_NAMES,
    }


import json
import os
from resume_extractor import extract_college_details
from ocr_service import extract_id_card_text

@app.post("/verify", response_model=VerifyResponse)
def verify_alumni(request: VerifyRequest):
    """
    Run ML verification pipeline on submitted alumni data.
    Processes uploaded ID Proof / Degree Certificate picture via EasyOCR & Resume Extractor.
    Returns a risk score (0-100), classification, feature breakdown, and extracted college details.
    """
    try:
        submitted = request.model_dump(exclude={"dbRecords"})
        db_record = request.dbRecords.model_dump() if request.dbRecords else None

        result = model.predict_risk(submitted, db_record)

        # 1. OCR Processing on Uploaded ID Proof / Degree Certificate Picture
        raw_image_path = request.imageFilePath or request.profilePhotoUrl or ""
        image_file_path = os.path.normpath(raw_image_path) if raw_image_path else ""
        ocr_text = ""
        ocr_result = None

        if image_file_path and os.path.exists(image_file_path):
            print(f"\n [IMAGE PARSING] Uploaded Certificate / ID Picture Detected: {image_file_path}")
            ocr_result = extract_id_card_text(front_path=image_file_path)
            ocr_text = ocr_result.get("front_text", "")
            result["ocrExtractedText"] = ocr_text

        # 2. Extract college details from OCR text OR submitted resume text
        combined_text_for_extraction = f"{ocr_text}\n{request.resumeText or ''}\n{request.bio or ''}".strip()
        college_details = extract_college_details(combined_text_for_extraction) if combined_text_for_extraction else None
        result["extractedCollegeDetails"] = college_details

        print("\n" + "=" * 80)
        print(" [PYTHON ML SERVICE] ALUMNI VERIFICATION INFERENCE")
        print("=" * 80)
        print(f"  - Submitted Name : {submitted.get('name')}")
        print(f"  - Register No     : {submitted.get('registerNumber') or 'N/A'}")
        print(f"  - Dept / Degree   : {submitted.get('department')} / {submitted.get('degree')}")
        print(f"  - Uploaded Image  : {image_file_path if image_file_path else 'None'}")
        print(f"  - OCR Text Found  : {'Yes (' + str(len(ocr_text)) + ' chars)' if ocr_text else 'None'}")
        print(f"  - Resume Text     : {'Yes (' + str(len(request.resumeText)) + ' chars)' if request.resumeText else 'None'}")
        print(f"  - DB Cross-Ref    : {'Matched' if db_record else 'None'}")
        print("-" * 80)
        print(f"  Risk Score: {result['riskScore']:.1f}/100  Class: {result['classification']}  Fraud Prob: {result['fraudProbability']}")
        print("  Features Breakdown:")
        print(json.dumps(result['features'], indent=4))
        print("=" * 80 + "\n")

        return VerifyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5050, log_level="info")
