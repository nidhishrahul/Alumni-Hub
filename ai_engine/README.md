# AlumniConnect AI — AI Engine
# Multi-Agent Alumni Intelligence Platform

This directory contains the ML/AI pipeline for the 6 AI agents.

## Agents
1. **Alumni Intelligence Agent** — Expertise scoring with Random Forest/XGBoost
2. **Smart Mentorship Matching Agent** — NLP + Cosine Similarity matching
3. **Career Opportunity Agent** — Skill embeddings + recommendation engine
4. **Alumni Engagement Agent** — Gradient Boosting engagement prediction
5. **AI Communication Assistant** — LLM-powered chatbot with RAG
6. **Alumni Analytics Agent** — Institutional analytics & trend prediction

## Requirements
See `requirements.txt` for ML dependencies (scikit-learn, sentence-transformers, SHAP, NetworkX)

## Structure
- `agents/` — Individual AI agent implementations
- `models/` — Trained model files
- `data/` — Datasets (raw, processed, synthetic)
- `explainability/` — SHAP & XAI utilities
- `graph/` — NetworkX social network analysis
- `embeddings/` — Sentence transformer embeddings
- `pipelines/` — Training & inference pipelines
