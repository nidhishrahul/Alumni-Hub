"""
RapidOCR (PaddleOCR ONNX Engine) & Document Extraction Service for Alumni Verification.

Performs optical character recognition (OCR) or PDF text extraction on front and back ID proof,
resume, or certificate files using RapidOCR (ONNX-powered PaddleOCR engine).

Architecture:
- RapidOCR is initialized ONCE per process via a module-level singleton (_paddle_reader).
- PDF files are parsed using pdfplumber (primary) or pypdf (fallback).
- Combined OCR text from both documents is returned for Groq LLM structuring pass.
"""

import os
import warnings
from typing import Optional, Dict, Any, List

warnings.filterwarnings("ignore")

# Module-level singleton — initialized ONCE, reused for ALL requests
_paddle_reader = None


def get_paddle_reader():
    """
    Lazy singleton initialization for RapidOCR (PaddleOCR ONNX engine).
    One-time startup only — instant initialization (~0.1s), reused across requests.
    """
    global _paddle_reader
    if _paddle_reader is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            print("[PADDLEOCR / RAPIDOCR] Initializing PaddleOCR ONNX Engine...")
            _paddle_reader = RapidOCR()
            print("[PADDLEOCR / RAPIDOCR] [OK] PaddleOCR ONNX Reader initialized and ready!")
        except ImportError:
            print("[PADDLEOCR WARNING] RapidOCR not installed. Run: pip install rapidocr-onnxruntime")
            _paddle_reader = False
        except Exception as e:
            print(f"[PADDLEOCR WARNING] Failed to initialize RapidOCR: {e}")
            _paddle_reader = False
    return _paddle_reader if _paddle_reader is not False else None


def _parse_single_file(file_path: str, paddle_reader=None) -> Dict[str, Any]:
    """
    Parse a single file (PDF or image) and return extracted lines & combined text.
    - PDF files -> pdfplumber / pypdf text extraction
    - Image files -> RapidOCR (PaddleOCR ONNX) recognition
    """
    lines = []
    file_type = "Unknown"

    if not file_path or not os.path.exists(file_path):
        return {"lines": [], "text": "", "file_type": "Missing", "success": False}

    ext = file_path.lower().split('.')[-1]

    # -- PDF Document ----------------------------------------------------------
    if ext == 'pdf':
        file_type = "PDF Document"
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    p_text = page.extract_text()
                    if p_text:
                        lines.extend([ln for ln in p_text.split('\n') if ln.strip()])
        except Exception:
            try:
                import pypdf
                pdf_reader = pypdf.PdfReader(file_path)
                for page in pdf_reader.pages:
                    p_text = page.extract_text()
                    if p_text:
                        lines.extend([ln for ln in p_text.split('\n') if ln.strip()])
            except Exception as e:
                print(f"  [PDF ERROR] Could not parse PDF: {e}")

    # -- Image File (RapidOCR / PaddleOCR ONNX) --------------------------------
    elif ext in ('png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif'):
        file_type = "Image (PaddleOCR ONNX)"
        if paddle_reader:
            try:
                ocr_result, elapse = paddle_reader(file_path)
                if ocr_result:
                    for item in ocr_result:
                        # RapidOCR format: [box, text_string, confidence_float]
                        if len(item) >= 3:
                            word = str(item[1]).strip()
                            confidence = float(item[2])
                            if confidence > 0.3 and word:
                                lines.append(word)
            except Exception as e:
                print(f"  [PADDLEOCR ERROR] Image OCR failed for {os.path.basename(file_path)}: {e}")
        else:
            print("  [PADDLEOCR WARNING] Reader not available - skipped image OCR")
    else:
        file_type = f"Unsupported ({ext})"
        print(f"  [WARNING] Unsupported file extension: .{ext}")

    text = "\n".join(lines) if ext == 'pdf' else " ".join(lines)
    return {
        "lines": lines,
        "text": text,
        "file_type": file_type,
        "success": bool(lines)
    }


def extract_id_card_text(
    front_path: Optional[str] = None,
    back_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main OCR extraction function.
    Processes front (Document 1) and back (Document 2) files.
    Returns combined raw text for downstream Groq LLM structuring.
    """
    reader = get_paddle_reader()

    result = {
        "front_text": "",
        "front_lines": [],
        "back_text": "",
        "back_lines": [],
        "extracted_successfully": False
    }

    print("\n" + "=" * 80)
    print(" [PADDLEOCR] DUAL-DOCUMENT TEXT EXTRACTION LOG")
    print("=" * 80)

    # -- Document 1: Front Side / Resume / Certificate -------------------------
    if front_path and os.path.exists(front_path):
        print(f"  * Document 1 (Front) : {os.path.basename(front_path)}")
        front_res = _parse_single_file(front_path, reader)
        result["front_lines"] = front_res["lines"]
        result["front_text"] = front_res["text"]
        result["extracted_successfully"] = front_res["success"]

        print(f"    Format             : {front_res['file_type']}")
        print(f"    Lines Extracted    : {len(front_res['lines'])}")
        print("    -- Raw Extracted Text (Front) --------------------------")
        if front_res["lines"]:
            for idx, line in enumerate(front_res["lines"][:20], 1):
                safe_line = line.encode('ascii', errors='replace').decode('ascii')
                print(f"    [{idx:02d}] {safe_line}")
            if len(front_res["lines"]) > 20:
                print(f"    ... (+{len(front_res['lines']) - 20} more lines)")
        else:
            print("    (No text detected on Front document)")
    else:
        print("  * Document 1 (Front) : Not provided or file not found")

    print("-" * 80)

    # -- Document 2: Back Side / ID Back --------------------------------------
    if back_path and os.path.exists(back_path):
        print(f"  * Document 2 (Back)  : {os.path.basename(back_path)}")
        back_res = _parse_single_file(back_path, reader)
        result["back_lines"] = back_res["lines"]
        result["back_text"] = back_res["text"]

        if back_res["success"]:
            result["extracted_successfully"] = True

        print(f"    Format             : {back_res['file_type']}")
        print(f"    Lines Extracted    : {len(back_res['lines'])}")
        print("    -- Raw Extracted Text (Back) ---------------------------")
        if back_res["lines"]:
            for idx, line in enumerate(back_res["lines"][:20], 1):
                safe_line = line.encode('ascii', errors='replace').decode('ascii')
                print(f"    [{idx:02d}] {safe_line}")
            if len(back_res["lines"]) > 20:
                print(f"    ... (+{len(back_res['lines']) - 20} more lines)")
        else:
            print("    (No text detected on Back document)")
    else:
        print("  * Document 2 (Back)  : Not provided or file not found")

    print("=" * 80 + "\n")
    return result
