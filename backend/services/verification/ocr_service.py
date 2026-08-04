"""
EasyOCR Service for Alumni ID Card Verification.

Performs optical character recognition (OCR) on front and back ID proof card images
using EasyOCR, printing the extracted raw text and structured line items to the local console.
"""

import os
from typing import Optional, Dict, Any, List

_reader = None


def get_ocr_reader():
    """Lazy initialization of EasyOCR reader to avoid slow startup times."""
    global _reader
    if _reader is None:
        try:
            import easyocr
            print("[EASYOCR] Initializing EasyOCR Reader (English)...")
            _reader = easyocr.Reader(['en'], gpu=False)
            print("[EASYOCR] EasyOCR Reader ready!")
        except Exception as e:
            print(f"[EASYOCR WARNING] Failed to load EasyOCR: {e}")
            _reader = False
    return _reader if _reader is not False else None


def extract_id_card_text(
    front_path: Optional[str] = None,
    back_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Perform OCR extraction on front and back ID card images.
    Prints extracted text to the local terminal.
    """
    reader = get_ocr_reader()

    result = {
        "front_text": "",
        "front_lines": [],
        "back_text": "",
        "back_lines": [],
        "extracted_successfully": False
    }

    print("\n" + "=" * 80)
    print(" [EASYOCR] ALUMNI ID CARD / CERTIFICATE TEXT EXTRACTION LOG")
    print("=" * 80)

    # 1. Process Front ID / Resume File (Image or PDF)
    if front_path and os.path.exists(front_path):
        print(f"  - Uploaded File Path  : {front_path}")

        # Check if uploaded file is a PDF
        if front_path.lower().endswith('.pdf'):
            print("  - File Format        : PDF Document")
            pdf_lines = []
            try:
                import pdfplumber
                with pdfplumber.open(front_path) as pdf:
                    for page in pdf.pages:
                        p_text = page.extract_text()
                        if p_text:
                            pdf_lines.extend(p_text.split('\n'))
            except Exception as e:
                try:
                    import pypdf
                    reader = pypdf.PdfReader(front_path)
                    for page in reader.pages:
                        p_text = page.extract_text()
                        if p_text:
                            pdf_lines.extend(p_text.split('\n'))
                except Exception as e2:
                    print(f"  [PDF ERROR] Failed to parse PDF: {e2}")

            result["front_lines"] = pdf_lines
            result["front_text"] = "\n".join(pdf_lines)
            result["extracted_successfully"] = bool(pdf_lines)

            print("    --- Extracted PDF Text Lines ---")
            if pdf_lines:
                for idx, line in enumerate(pdf_lines[:15], 1):
                    print(f"    Line {idx:02d}: {line}")
                if len(pdf_lines) > 15:
                    print(f"    ... (+{len(pdf_lines) - 15} more lines)")
            else:
                print("    (No text detected in PDF document)")

        elif reader:
            try:
                front_res = reader.readtext(front_path, detail=0)
                result["front_lines"] = front_res
                result["front_text"] = " ".join(front_res)
                result["extracted_successfully"] = True

                print("    --- Extracted Image Text Lines ---")
                if front_res:
                    for idx, line in enumerate(front_res, 1):
                        print(f"    Line {idx:02d}: {line}")
                else:
                    print("    (No text detected on image)")
            except Exception as e:
                print(f"  [OCR ERROR] Image OCR Exception: {e}")
        else:
            print("  [OCR WARNING] Reader unavailable — skipped OCR parsing")
    else:
        print(f"  - Uploaded File Path  : Not Provided or File Not Found ({front_path})")

    print("-" * 80)

    # 2. Process Back ID Image
    if back_path and os.path.exists(back_path):
        print(f"  - Back Image File     : {back_path}")
        if reader:
            try:
                back_res = reader.readtext(back_path, detail=0)
                result["back_lines"] = back_res
                result["back_text"] = " ".join(back_res)
                result["extracted_successfully"] = True

                print("    --- Back Side Extracted Text Lines ---")
                if back_res:
                    for idx, line in enumerate(back_res, 1):
                        print(f"    Line {idx:02d}: {line}")
                else:
                    print("    (No text detected on back image)")
            except Exception as e:
                print(f"  [OCR ERROR] Back OCR Exception: {e}")
        else:
            print("  [OCR WARNING] EasyOCR Reader unavailable — skipped OCR parsing")
    else:
        print(f"  - Back Image File     : Not Provided or File Not Found ({back_path})")

    print("=" * 80 + "\n")
    return result
