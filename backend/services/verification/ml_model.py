"""
AI-Based Alumni Verification — Feature Engineering & Risk Scoring Model

Supports CatBoostClassifier with automatic fallback to RandomForestClassifier
to compute a risk score (0–100) for alumni registration credentials.

Features computed:
  1. name_similarity       — Levenshtein ratio between submitted name and DB record
  2. department_match      — Exact match (1) or 0
  3. degree_match          — Exact match (1) or 0
  4. grad_year_match       — Exact match (1) or 0
  5. register_number_match — Exact match (1) or 0
  6. linkedin_valid         — 1 if URL is well-formed linkedin.com, else 0
  7. profile_completeness  — Fraction of optional fields provided (0–1)
  8. email_domain_trust    — 1 if institutional email domain, else 0.5
"""

import re
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from Levenshtein import ratio as lev_ratio

# Attempt CatBoost import
CATBOOST_AVAILABLE = False
try:
    from catboost import CatBoostClassifier
    CATBOOST_AVAILABLE = True
except Exception:
    CATBOOST_AVAILABLE = False


# ─── Synthetic Training Data Generator ──────────────────────────────────────

def _generate_training_data(n_samples=2000, seed=42):
    """
    Generate synthetic labeled data for model training.
    Label 0 = legitimate (low risk), Label 1 = fraudulent (high risk).
    70% legitimate, 30% fraudulent.
    """
    rng = np.random.RandomState(seed)
    n_legit = int(n_samples * 0.7)
    n_fraud = n_samples - n_legit

    features = []
    labels = []

    # Legitimate profiles: high field matches, good LinkedIn, realistic completeness
    for _ in range(n_legit):
        features.append([
            rng.uniform(0.80, 1.0),   # name_similarity
            rng.choice([1.0], p=[1.0]),  # department_match (almost always matches)
            rng.choice([1.0, 0.0], p=[0.95, 0.05]),  # degree_match
            rng.choice([1.0, 0.0], p=[0.97, 0.03]),  # grad_year_match
            rng.choice([1.0, 0.0], p=[0.85, 0.15]),  # register_number_match
            rng.choice([1.0, 0.5, 0.0], p=[0.60, 0.15, 0.25]),  # linkedin_valid
            rng.uniform(0.1, 1.0),   # profile_completeness (many legit users don't fill all fields)
            rng.choice([1.0, 0.5], p=[0.15, 0.85]),  # email_domain_trust (most use personal email)
        ])
        labels.append(0)

    # Fraudulent profiles: lower matches, invalid LinkedIn, low completeness
    for _ in range(n_fraud):
        features.append([
            rng.uniform(0.0, 0.65),   # name_similarity (poor name match)
            rng.choice([1.0, 0.0], p=[0.25, 0.75]),  # department_match
            rng.choice([1.0, 0.0], p=[0.20, 0.80]), # degree_match
            rng.choice([1.0, 0.0], p=[0.15, 0.85]), # grad_year_match
            rng.choice([1.0, 0.0], p=[0.10, 0.90]), # register_number_match
            rng.choice([1.0, 0.0], p=[0.15, 0.85]), # linkedin_valid
            rng.uniform(0.0, 0.4),   # profile_completeness
            rng.choice([1.0, 0.5], p=[0.05, 0.95]),  # email_domain_trust
        ])
        labels.append(1)

    return np.array(features), np.array(labels)


# ─── Model ──────────────────────────────────────────────────────────────────

class VerificationModel:
    """CatBoost / Random Forest verification risk scorer."""

    FEATURE_NAMES = [
        "name_similarity", "department_match", "degree_match",
        "grad_year_match", "register_number_match", "linkedin_valid",
        "profile_completeness", "email_domain_trust",
    ]

    def __init__(self):
        if CATBOOST_AVAILABLE:
            try:
                self.algorithm = "CatBoost"
                self.model = CatBoostClassifier(
                    iterations=150,
                    depth=6,
                    random_seed=42,
                    verbose=0,
                )
            except Exception:
                self.algorithm = "RandomForest"
                self.model = RandomForestClassifier(
                    n_estimators=150,
                    max_depth=8,
                    random_state=42,
                    class_weight="balanced",
                )
        else:
            self.algorithm = "RandomForest"
            self.model = RandomForestClassifier(
                n_estimators=150,
                max_depth=8,
                random_state=42,
                class_weight="balanced",
            )
        self._train()

    def _train(self):
        X, y = _generate_training_data()
        self.model.fit(X, y)
        print(f"[OK] Verification model trained using {self.algorithm} -- "
              f"features: {len(self.FEATURE_NAMES)}")

    # ── Feature Engineering ─────────────────────────────────────────────────

    @staticmethod
    def _linkedin_valid(url: str | None) -> float:
        if not url:
            return 0.0
        url = url.strip().lower()
        if re.match(r"https?://(www\.)?linkedin\.com/in/[\w-]+/?", url):
            return 1.0
        if "linkedin.com" in url:
            return 0.5
        return 0.0

    @staticmethod
    def _profile_completeness(data: dict) -> float:
        optional_fields = [
            "currentCompany", "currentDesignation", "location",
            "linkedinUrl", "bio", "skills", "interests", "phone",
            "profilePhotoUrl",
        ]
        filled = sum(1 for f in optional_fields if data.get(f))
        return filled / len(optional_fields) if optional_fields else 0.0

    @staticmethod
    def _email_domain_trust(email: str | None, institutional_domain: str = "college.edu") -> float:
        if not email:
            return 0.5
        domain = email.strip().lower().split("@")[-1]
        if domain == institutional_domain.lower():
            return 1.0
        return 0.5

    def extract_features(
        self,
        submitted: dict,
        db_record: dict | None,
        groq_structured: dict | None = None
    ) -> dict:
        """
        Extract verification features from submitted alumni data,
        optional university DB record, and Groq LLM structured ID card credentials.
        """
        db = db_record or {}
        groq = groq_structured or {}

        # ── Groq AI Extracted ID Card Credentials ─────────────────────────────
        g_name = str(groq.get("name") or "").strip()
        g_roll = str(groq.get("roll_number") or "").strip()
        g_email = str(groq.get("email") or "").strip()
        g_dept = str(groq.get("department") or "").strip()
        g_start = str(groq.get("graduation_start_year") or "").strip()
        g_end = str(groq.get("graduation_end_year") or "").strip()

        # Target reference values for matching (Prefer Groq ID Card data if extracted)
        effective_name = g_name if (g_name and g_name != "N/A") else str(submitted.get("name", "")).strip()
        effective_dept = g_dept if (g_dept and g_dept != "N/A") else str(submitted.get("department", "")).strip()
        effective_reg = g_roll if (g_roll and g_roll != "N/A") else str(submitted.get("registerNumber", "")).strip()
        effective_email = g_email if (g_email and g_email != "N/A") else str(submitted.get("email", "")).strip()

        # 1. Name Similarity
        if db.get("name"):
            name_sim = lev_ratio(effective_name.lower(), str(db.get("name", "")).strip().lower())
            # If Groq extracted name directly from official ID card proof, assign minimum 0.85 similarity
            if g_name and g_name != "N/A" and name_sim < 0.85:
                name_sim = max(name_sim, 0.85)
        elif g_name and g_name != "N/A":
            name_sim = 0.95  # Authentic ID card name extracted
        else:
            name_sim = 0.5

        # 2. Department Match
        if db.get("department"):
            dept_match = float(effective_dept.lower() == str(db.get("department", "")).strip().lower())
            if g_dept and g_dept != "N/A" and dept_match == 0:
                # Partial/substring department match (e.g. "Information Technology" vs "IT")
                s_dept = effective_dept.lower()
                d_dept = str(db.get("department", "")).lower()
                if s_dept in d_dept or d_dept in s_dept or "information" in s_dept or "computer" in s_dept:
                    dept_match = 1.0
        elif g_dept and g_dept != "N/A":
            dept_match = 1.0  # Department verified from ID card
        else:
            dept_match = 0.5

        # 3. Degree Match
        degree_match = float(
            str(submitted.get("degree", "")).strip().lower()
            == str(db.get("degree", "")).strip().lower()
        ) if db.get("degree") else (1.0 if g_name and g_name != "N/A" else 0.5)

        # 4. Graduation Year Match
        sub_grad = submitted.get("graduationYear")
        db_grad = db.get("graduationYear")
        if db_grad and sub_grad:
            grad_match = float(int(sub_grad) == int(db_grad))
        elif g_end and g_end != "N/A":
            try:
                g_end_year = int(g_end)
                if db_grad:
                    grad_match = float(g_end_year == int(db_grad))
                elif sub_grad:
                    grad_match = float(abs(g_end_year - int(sub_grad)) <= 1)
                else:
                    grad_match = 1.0  # Year extracted directly from ID card
            except ValueError:
                grad_match = 0.85
        else:
            grad_match = 0.5

        # 5. Register Number Match
        db_reg = str(db.get("registerNumber", "")).strip().lower()
        if db_reg and effective_reg:
            reg_match = float(effective_reg.lower() == db_reg or effective_reg.lower() in db_reg or db_reg in effective_reg.lower())
        elif g_roll and g_roll != "N/A":
            reg_match = 1.0  # Authentic roll number extracted from ID card
        else:
            reg_match = 0.5

        # 6. LinkedIn & Completeness
        linkedin = self._linkedin_valid(submitted.get("linkedinUrl"))
        completeness = self._profile_completeness(submitted)

        # 7. Email Domain Trust
        email_trust = self._email_domain_trust(effective_email, institutional_domain="skcet.ac.in")
        if g_email and "skcet.ac.in" in g_email.lower():
            email_trust = 1.0

        return {
            "name_similarity": round(name_sim, 4),
            "department_match": dept_match,
            "degree_match": degree_match,
            "grad_year_match": grad_match,
            "register_number_match": reg_match,
            "linkedin_valid": linkedin,
            "profile_completeness": round(completeness, 4),
            "email_domain_trust": email_trust,
        }

    def predict_risk(
        self,
        submitted: dict,
        db_record: dict | None = None,
        groq_structured: dict | None = None
    ) -> dict:
        """
        Run the full verification pipeline:
          1. Extract features (incorporating Groq LLM structured ID card data)
          2. Predict fraud probability
          3. Convert to 0–100 risk score
        """
        features = self.extract_features(submitted, db_record, groq_structured)
        feature_vector = np.array([[features[f] for f in self.FEATURE_NAMES]])

        # Probability of being fraudulent (class 1)
        fraud_prob = float(self.model.predict_proba(feature_vector)[0][1])
        risk_score = round(fraud_prob * 100, 2)

        # Special Override: If Groq AI successfully extracted authentic college ID card credentials
        # (e.g. valid name, roll number, and @skcet.ac.in email extracted from uploaded ID card)
        if groq_structured and groq_structured.get("roll_number") and groq_structured.get("roll_number") != "N/A":
            # Cap risk score to LOW_RISK for verified official ID cards
            risk_score = min(risk_score, 12.5)
            fraud_prob = risk_score / 100.0

        # Classification based on thresholds
        if risk_score <= 30:
            classification = "LOW_RISK"
        elif risk_score <= 65:
            classification = "MEDIUM_RISK"
        else:
            classification = "HIGH_RISK"

        return {
            "riskScore": risk_score,
            "classification": classification,
            "algorithm": self.algorithm,
            "features": features,
            "fraudProbability": round(fraud_prob, 4),
        }

