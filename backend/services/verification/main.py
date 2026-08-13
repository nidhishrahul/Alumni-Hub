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
    backImageFilePath: Optional[str] = None
    dbRecords: Optional[DbRecord] = None


class VerifyResponse(BaseModel):
    riskScore: float
    classification: str
    features: dict
    fraudProbability: float
    extractedCollegeDetails: Optional[dict] = None
    ocrExtractedText: Optional[str] = None
    groqStructured: Optional[dict] = None


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
from groq_service import groq_structuring_pass

@app.post("/verify", response_model=VerifyResponse)
def verify_alumni(request: VerifyRequest):
    """
    Run ML verification pipeline on submitted alumni data.
    Processes uploaded Front and Back ID Proof / Certificate images / Resume via PaddleOCR & Resume Extractor.
    Runs Groq LLM structuring pass to extract clean credential fields from raw OCR text.
    Returns a risk score (0-100), classification, feature breakdown, extracted college details, and Groq structured credentials.
    """
    try:
        submitted = request.model_dump(exclude={"dbRecords"})
        db_record = request.dbRecords.model_dump() if request.dbRecords else None

        # 1. OCR Processing on Uploaded Front & Back Images / Resume PDF
        raw_front_path = request.imageFilePath or request.profilePhotoUrl or ""
        front_file_path = os.path.normpath(raw_front_path) if raw_front_path else ""

        raw_back_path = request.backImageFilePath or ""
        back_file_path = os.path.normpath(raw_back_path) if raw_back_path else ""

        ocr_text = ""
        ocr_result = None

        if (front_file_path and os.path.exists(front_file_path)) or (back_file_path and os.path.exists(back_file_path)):
            print(f"\n [IMAGE PARSING] Dual-Image OCR Extraction Triggered:")
            if front_file_path:
                print(f"   - Front File Path: {front_file_path}")
            if back_file_path:
                print(f"   - Back File Path : {back_file_path}")

            ocr_result = extract_id_card_text(front_path=front_file_path if os.path.exists(front_file_path) else None,
                                               back_path=back_file_path if os.path.exists(back_file_path) else None)
            
            front_text = ocr_result.get("front_text", "")
            back_text = ocr_result.get("back_text", "")
            ocr_text = f"{front_text}\n{back_text}".strip()

        # 2. Groq LLM Structuring Pass — convert raw OCR text → clean structured JSON
        groq_structured = {}
        if ocr_text and ocr_text.strip():
            print("\n [GROQ AI] Triggering LLM structuring pass on combined OCR text...")
            groq_structured = groq_structuring_pass(ocr_text)
        else:
            print("\n [GROQ AI] No OCR text available — skipping LLM structuring pass.")
            groq_structured = None

        # 3. Extract college details from combined OCR text / resume text
        combined_text_for_extraction = f"{ocr_text}\n{request.resumeText or ''}\n{request.bio or ''}".strip()
        college_details = extract_college_details(combined_text_for_extraction) if combined_text_for_extraction else None

        # 4. Predict Risk using ML Model (passing Groq AI extracted credentials for high accuracy scoring)
        result = model.predict_risk(submitted, db_record, groq_structured)
        result["ocrExtractedText"] = ocr_text
        result["extractedCollegeDetails"] = college_details
        result["groqStructured"] = groq_structured

        def _safe(v):
            if v is None:
                return "N/A"
            return str(v).encode('ascii', errors='ignore').decode('ascii').strip() or "N/A"

        print("\n" + "=" * 80)
        print(" [PYTHON ML SERVICE] ALUMNI VERIFICATION INFERENCE")
        print("=" * 80)
        print(f"  - Submitted Name : {_safe(submitted.get('name'))}")
        print(f"  - Register No     : {_safe(submitted.get('registerNumber'))}")
        print(f"  - Dept / Degree   : {_safe(submitted.get('department'))} / {_safe(submitted.get('degree'))}")
        print(f"  - Front Image     : {front_file_path if front_file_path else 'None'}")
        print(f"  - Back Image      : {back_file_path if back_file_path else 'None'}")
        print(f"  - OCR Text Found  : {'Yes (' + str(len(ocr_text)) + ' chars combined)' if ocr_text else 'None'}")
        print(f"  - Resume Text     : {'Yes (' + str(len(request.resumeText)) + ' chars)' if request.resumeText else 'None'}")
        print(f"  - DB Cross-Ref    : {'Matched' if db_record else 'None'}")
        if groq_structured and groq_structured.get('name'):
            print(f"  - Groq Name       : {_safe(groq_structured.get('name'))}")
            print(f"  - Groq Roll No    : {_safe(groq_structured.get('roll_number'))}")
            print(f"  - Groq Dept       : {_safe(groq_structured.get('department'))}")
            print(f"  - Groq Email      : {_safe(groq_structured.get('email'))}")
            print(f"  - Groq DOB        : {_safe(groq_structured.get('date_of_birth'))}")
            print(f"  - Groq Grad       : {_safe(groq_structured.get('graduation_start_year'))} - {_safe(groq_structured.get('graduation_end_year'))}")
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
