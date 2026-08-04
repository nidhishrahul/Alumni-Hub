"""
Resume College Details Extractor

Extracts educational credentials (University, Degree, Department, Graduation Year, 
Register/Roll Number, and CGPA/Percentage) from resume text using NLP regex patterns.
"""

import re
from typing import Dict, Any, Optional


def extract_college_details(resume_text: str) -> Dict[str, Any]:
    """
    Parses resume text and extracts college/university related credentials.
    Prints the extracted details formatted cleanly to the local console.
    """
    if not resume_text or not resume_text.strip():
        return {
            "university": None,
            "degree": None,
            "department": None,
            "graduation_year": None,
            "register_number": None,
            "cgpa": None,
            "extracted": False
        }

    text = resume_text.strip()

    # 1. Extract University / College Name
    univ_patterns = [
        r'(?i)(Sri\s+Krishna\s+College\s+of\s+Engineering\s+and\s+Technology(?:,\s*Coimbatore)?)',
        r'(?i)(Anna\s+University(?:,\s*[A-Za-z\s]+)?|IIT\s+[A-Z][a-z]+|NIT\s+[A-Z][a-z]+|BITS\s+[A-Z][a-z]+|CEG|MIT|SRM\s+University|VIT\s+University|PSG\s+Tech)',
        r'(?i)([A-Z][A-Za-z\s&]+(?:University|Institute of Technology|College of Engineering|Institute of Science|Autonomous College|Affiliated College))',
        r'(?i)(College\s+of\s+[A-Za-z\s]+|University\s+of\s+[A-Za-z\s]+)',
    ]
    university = None
    ignored_headers = {'EDUCATION', 'EXPERIENCE', 'WORK EXPERIENCE', 'PROJECTS', 'SKILLS', 'SUMMARY', 'EVENTS', 'ABOUT ME'}
    for pattern in univ_patterns:
        matches = re.finditer(pattern, text)
        for match in matches:
            candidate = match.group(1).strip().replace('\n', ' ').strip()
            # Clean up leading intro text like "Currently pursuing my Bachelors at "
            if " at " in candidate.lower():
                candidate = candidate.split(" at ")[-1].strip()
            if candidate.upper() not in ignored_headers and len(candidate) > 3:
                university = candidate
                break
        if university:
            break

    # 2. Extract Degree
    degree_pattern = r'(?i)\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?S\.?|B\.?Sc|M\.?Sc|B\.?C\.?A|M\.?C\.?A|BBA|MBA|Ph\.?D|Bachelor of [A-Za-z\s]+|Master of [A-Za-z\s]+)\b'
    degree_match = re.search(degree_pattern, text)
    degree = degree_match.group(1).strip() if degree_match else None

    # 3. Extract Department / Major
    dept_pattern = r'(?i)\b(Information Technology|Computer Science(?: and Engineering)?|Electrical(?: and Electronics)?|Electronics(?: and Communication)?|Mechanical|Civil|Data Science|Artificial Intelligence|Cyber Security|Chemical|Biotechnology|Aeronautical)\b'
    dept_match = re.search(dept_pattern, text)
    department = dept_match.group(1).strip() if dept_match else None

    # 4. Extract Graduation Year
    year_pattern = r'\b(20[0-2][0-9]|19[8-9][0-9])\b'
    years = re.findall(year_pattern, text)
    graduation_year = None
    if years:
        years_int = [int(y) for y in years if 1990 <= int(y) <= 2030]
        if years_int:
            graduation_year = max(years_int)

    # 5. Extract Register / Roll Number
    reg_pattern = r'(?i)(?:Reg(?:ister)?|Roll|Student\s*ID)\s*(?:No|Num|Number|#)?\s*[:.-]?\s*([A-Za-z0-9]{5,15})\b'
    reg_match = re.search(reg_pattern, text)
    register_number = None
    if reg_match:
        cand_reg = reg_match.group(1).strip()
        if cand_reg.lower() not in ('istration', 'istration System', 'istration Course'):
            register_number = cand_reg

    # 6. Extract CGPA / Percentage
    cgpa_pattern = r'(?i)(?:CGPA|GPA|Aggregate)\s*[:.-]?\s*(\d+(?:\.\d+)?(?:\s*\/\s*10)?)|(\d{2}(?:\.\d+)?\s*%)'
    cgpa_match = re.search(cgpa_pattern, text)
    cgpa = None
    if cgpa_match:
        cgpa = cgpa_match.group(1) or cgpa_match.group(2)

    extracted_details = {
        "university": university or "Not explicitly detected",
        "degree": degree or "Not detected",
        "department": department or "Not detected",
        "graduation_year": graduation_year,
        "register_number": register_number or "Not detected",
        "cgpa": cgpa or "Not detected",
        "extracted": bool(university or degree or department or graduation_year)
    }

    # ═════════════════════════════════════════════════════════════════════════
    #  LOCAL TERMINAL PRINT — RESUME COLLEGE DETAILS EXTRACTION
    # ═════════════════════════════════════════════════════════════════════════
    print("\n" + "=" * 80)
    print(" [RESUME EXTRACTION] COLLEGE DETAILS EXTRACTED FROM RESUME")
    print("=" * 80)
    print(f"  - University / College : {extracted_details['university']}")
    print(f"  - Degree Extracted     : {extracted_details['degree']}")
    print(f"  - Department / Major   : {extracted_details['department']}")
    print(f"  - Graduation Year      : {extracted_details['graduation_year'] or 'N/A'}")
    print(f"  - Register / Roll No   : {extracted_details['register_number']}")
    print(f"  - CGPA / Grade         : {extracted_details['cgpa']}")
    print("-" * 80)

    # Print a snippet of the resume text for reference
    snippet = text[:300].replace('\n', ' ')
    print(f"  - Resume Snippet       : \"{snippet}...\"")
    print("=" * 80 + "\n")

    return extracted_details


if __name__ == "__main__":
    sample_resume = """
    Rahul Kumar
    Email: rahul.kumar@gmail.com | Phone: +91 9876543210
    LinkedIn: linkedin.com/in/rahulkumar
    
    EDUCATION:
    Anna University, College of Engineering Guindy
    Bachelor of Engineering (B.E.) in Computer Science and Engineering
    Graduation Year: 2022 | Reg No: CSE2019042 | CGPA: 8.75/10
    
    EXPERIENCE:
    Software Development Engineer at Google (2022 - Present)
    Built scalable microservices in Python and Node.js.
    """
    extract_college_details(sample_resume)
