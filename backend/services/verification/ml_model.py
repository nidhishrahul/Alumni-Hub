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

    # Legitimate profiles: high field matches, good LinkedIn, high completeness
    for _ in range(n_legit):
        features.append([
            rng.uniform(0.85, 1.0),   # name_similarity
            rng.choice([1.0], p=[1.0]),  # department_match (almost always matches)
            rng.choice([1.0, 0.0], p=[0.95, 0.05]),  # degree_match
            rng.choice([1.0, 0.0], p=[0.97, 0.03]),  # grad_year_match
            rng.choice([1.0, 0.0], p=[0.90, 0.10]),  # register_number_match
            rng.choice([1.0, 0.0], p=[0.80, 0.20]),  # linkedin_valid
            rng.uniform(0.6, 1.0),   # profile_completeness
            rng.choice([1.0, 0.5], p=[0.30, 0.70]),  # email_domain_trust
        ])
        labels.append(0)

    # Fraudulent profiles: lower matches, invalid LinkedIn, low completeness
    for _ in range(n_fraud):
        features.append([
            rng.uniform(0.1, 0.7),   # name_similarity
            rng.choice([1.0, 0.0], p=[0.3, 0.7]),  # department_match
            rng.choice([1.0, 0.0], p=[0.25, 0.75]), # degree_match
            rng.choice([1.0, 0.0], p=[0.20, 0.80]), # grad_year_match
            rng.choice([1.0, 0.0], p=[0.15, 0.85]), # register_number_match
            rng.choice([1.0, 0.0], p=[0.20, 0.80]), # linkedin_valid
            rng.uniform(0.1, 0.5),   # profile_completeness
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

    def extract_features(self, submitted: dict, db_record: dict | None) -> dict:
        """
        Extract verification features from submitted alumni data and
        optional university DB record for cross-referencing.
        """
        db = db_record or {}

        name_sim = lev_ratio(
            str(submitted.get("name", "")).strip().lower(),
            str(db.get("name", "")).strip().lower(),
        ) if db.get("name") else 0.5

        dept_match = float(
            str(submitted.get("department", "")).strip().lower()
            == str(db.get("department", "")).strip().lower()
        ) if db.get("department") else 0.5

        degree_match = float(
            str(submitted.get("degree", "")).strip().lower()
            == str(db.get("degree", "")).strip().lower()
        ) if db.get("degree") else 0.5

        grad_match = float(
            submitted.get("graduationYear") == db.get("graduationYear")
        ) if db.get("graduationYear") else 0.5

        reg_match = float(
            str(submitted.get("registerNumber", "")).strip().lower()
            == str(db.get("registerNumber", "")).strip().lower()
        ) if db.get("registerNumber") and submitted.get("registerNumber") else 0.5

        linkedin = self._linkedin_valid(submitted.get("linkedinUrl"))
        completeness = self._profile_completeness(submitted)
        email_trust = self._email_domain_trust(submitted.get("email"))

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

    def predict_risk(self, submitted: dict, db_record: dict | None = None) -> dict:
        """
        Run the full verification pipeline:
          1. Extract features
          2. Predict fraud probability
          3. Convert to 0–100 risk score

        Returns dict with riskScore, classification, algorithm, and feature breakdown.
        """
        features = self.extract_features(submitted, db_record)
        feature_vector = np.array([[features[f] for f in self.FEATURE_NAMES]])

        # Probability of being fraudulent (class 1)
        fraud_prob = self.model.predict_proba(feature_vector)[0][1]
        risk_score = round(fraud_prob * 100, 2)

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
