"""
Groq AI Structuring Service for Alumni Verification.

Takes raw, noisy, unstructured OCR text extracted from ID card images / documents,
and uses the Groq LLM (llama-3.1-8b-instant) to parse and return clean structured JSON.

Target Schema (SKCET-format ID cards):
  - name             : Full name of the student
  - roll_number      : e.g. 727723euit263 (near name, dept, graduation year on ID card)
  - email            : College email e.g. 727723euit263@skcet.ac.in
  - department       : e.g. Information Technology, Computer Science
  - graduation_start_year : e.g. 2023
  - graduation_end_year   : e.g. 2027
  - phone_number     : 10-digit mobile number
  - date_of_birth    : e.g. 19.03.2006 (DD.MM.YYYY)
  - additional_info  : Any other useful detected info (batch, section, blood group, address, etc.)
"""

import json
import os
import re
from typing import Dict, Any

# add the key here

# Module-level singleton for Groq client (one-time initialization)
_groq_client = None


def get_groq_client():
    """Lazy singleton initialization of the Groq API client."""
    global _groq_client
    if _groq_client is None:
        try:
            from groq import Groq
            _groq_client = Groq(api_key=GROQ_API_KEY)
            print("[GROQ] Client initialized with model:", GROQ_MODEL)
        except ImportError:
            print("[GROQ WARNING] groq package not installed. Run: pip install groq")
            _groq_client = False
        except Exception as e:
            print(f"[GROQ WARNING] Failed to initialize Groq Client: {e}")
            _groq_client = False
    return _groq_client if _groq_client is not False else None


SYSTEM_PROMPT = """\
You are a precise alumni ID card data extraction assistant for SKCET (Sri Krishna College of Engineering and Technology).

Given raw, unstructured and possibly broken OCR text from a college ID card or document, extract and return ONLY valid JSON with these exact keys:

{
  "name": "Full student name",
  "roll_number": "e.g. 727723euit263 (alphanumeric near name and department)",
  "email": "e.g. 727723euit263@skcet.ac.in (college email)",
  "department": "e.g. Information Technology",
  "graduation_start_year": 2023,
  "graduation_end_year": 2027,
  "phone_number": "10-digit phone number",
  "date_of_birth": "DD.MM.YYYY format, e.g. 19.03.2006",
  "additional_info": "Any other useful fields like blood group, batch, address, etc."
}

Rules:
- Roll number is typically alphanumeric like '727723euit263' and appears near the student name, department, and graduation year.
- College email follows the pattern: <rollnumber>@skcet.ac.in
- Graduation appears as a range like 2023-2027 — split into start and end year as integers.
- Date of birth appears in DD.MM.YYYY format.
- If a field is not found in the text, set its value to null.
- Return ONLY the JSON object. No explanation, no preamble, no markdown fences.
"""


def groq_structuring_pass(raw_ocr_text: str) -> Dict[str, Any]:
    """
    Send raw OCR text to Groq LLM for structured JSON extraction.

    Args:
        raw_ocr_text: Combined unstructured text extracted from front + back documents.

    Returns:
        Structured dict with extracted fields, or empty dict on failure.
    """
    client = get_groq_client()

    empty_result = {
        "name": None,
        "roll_number": None,
        "email": None,
        "department": None,
        "graduation_start_year": None,
        "graduation_end_year": None,
        "phone_number": None,
        "date_of_birth": None,
        "additional_info": None,
    }

    if not client:
        print("[GROQ] Client unavailable - skipping LLM structuring pass.")
        return empty_result

    if not raw_ocr_text or not raw_ocr_text.strip():
        print("[GROQ] No OCR text provided - skipping LLM structuring pass.")
        return empty_result

    # Truncate to avoid token limit issues (8k context for llama-3.1-8b-instant)
    truncated_text = raw_ocr_text[:4000]

    def _p(s):
        """ASCII-safe print helper for Windows cp1252 console."""
        safe = str(s).encode('ascii', errors='ignore').decode('ascii')
        print(safe)

    print("\n" + "=" * 80)
    print(" [GROQ AI] STRUCTURING RAW OCR TEXT -> STRUCTURED JSON")
    print(f"  Model      : {GROQ_MODEL}")
    print(f"  Input Chars: {len(truncated_text)} characters")
    print("=" * 80)

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": f"Extract structured information from this OCR text:\n\n{truncated_text}"},
            ],
            temperature=0.0,   # Deterministic output for JSON extraction
            max_tokens=512,
        )

        raw_response = response.choices[0].message.content.strip()

        # Strip markdown fences if the model wraps response in ```json ... ```
        cleaned = raw_response
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-z]*\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)

        structured = json.loads(cleaned)

        def _safe_str(val):
            if val is None:
                return "N/A"
            s = str(val)
            return s.encode('ascii', errors='ignore').decode('ascii').strip() or "N/A"

        # Terminal Print - Structured Output
        print("\n [GROQ AI] EXTRACTED STRUCTURED CREDENTIALS:")
        print("-" * 80)
        print(f"  Name                 : {_safe_str(structured.get('name'))}")
        print(f"  Roll Number          : {_safe_str(structured.get('roll_number'))}")
        print(f"  Email                : {_safe_str(structured.get('email'))}")
        print(f"  Department           : {_safe_str(structured.get('department'))}")
        print(f"  Graduation (Start)   : {_safe_str(structured.get('graduation_start_year'))}")
        print(f"  Graduation (End)     : {_safe_str(structured.get('graduation_end_year'))}")
        print(f"  Phone Number         : {_safe_str(structured.get('phone_number'))}")
        print(f"  Date of Birth        : {_safe_str(structured.get('date_of_birth'))}")
        print(f"  Additional Info      : {_safe_str(structured.get('additional_info'))}")
        print("-" * 80)
        safe_json = {k: _safe_str(v) for k, v in structured.items()}
        print(f"\n  [GROQ] Cleaned JSON Response:\n{json.dumps(safe_json, indent=4)}")
        print("=" * 80 + "\n")

        return structured

    except json.JSONDecodeError as je:
        _p(f"[GROQ ERROR] Failed to parse JSON response: {je}")
        _p(f"[GROQ RAW RESPONSE] {raw_response}")
    except Exception as e:
        _p(f"[GROQ ERROR] LLM structuring pass failed: {e}")

    return empty_result
