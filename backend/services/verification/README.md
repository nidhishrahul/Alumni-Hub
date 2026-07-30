# AI-Based Alumni Verification Microservice

FastAPI + scikit-learn Random Forest microservice that scores alumni registrations for risk.

## Risk Thresholds

| Score Range | Classification | Action |
|---|---|---|
| 0–30 | LOW_RISK | Auto-verified, green badge |
| 31–65 | MEDIUM_RISK | Queued for admin review |
| 66–100 | HIGH_RISK | Auto-rejected |

Thresholds are configurable via `AI_RISK_THRESHOLD_LOW` and `AI_RISK_THRESHOLD_HIGH` env vars in `backend/.env`.

## Running

```bash
cd backend/services/verification
pip install -r requirements.txt
python main.py
```

Service runs on **http://localhost:5050**. Endpoints:
- `GET /health` — health check
- `POST /verify` — accepts alumni JSON, returns `{ riskScore, classification, features, fraudProbability }`
- `GET /docs` — Swagger UI

## How It Connects to Node.js

The Express backend (`routes/ai-verification.js`) calls `POST http://localhost:5050/verify` with the alumni's submitted data and any matching DB records. The Node server reads `AI_VERIFICATION_URL` from `.env`.

## ML Features

1. **name_similarity** — Levenshtein ratio between submitted name and DB record
2. **department_match** — Exact match flag
3. **degree_match** — Exact match flag
4. **grad_year_match** — Exact match flag
5. **register_number_match** — Exact match flag
6. **linkedin_valid** — URL format validation
7. **profile_completeness** — Fraction of optional fields filled
8. **email_domain_trust** — Institutional email domain check
