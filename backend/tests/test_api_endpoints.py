import sys
import os
sys.path.insert(0, os.path.abspath("."))
import pymupdf
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.database.session import SessionLocal
from app.services.auth_service import ensure_demo_user_seeded, create_access_token, DEMO_USER_ID, DEMO_EMAIL

client = TestClient(app)

db = SessionLocal()
ensure_demo_user_seeded(db)
db.close()
demo_token = create_access_token(user_id=DEMO_USER_ID, email=DEMO_EMAIL)
auth_headers = {"Authorization": f"Bearer {demo_token}"}


def create_test_pdf(text: str) -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_analyze_missing_role():
    pdf = create_test_pdf("John Doe Software Engineer with React and Python skills.")
    res = client.post(
        "/api/analysis/analyze",
        headers=auth_headers,
        data={"target_role": "   ", "job_description": "We are looking for a Senior Developer with 5 years experience."},
        files={"file": ("resume.pdf", pdf, "application/pdf")},
    )
    assert res.status_code == 400
    assert "target job role is required" in res.json()["detail"].lower()
    print("[PASS] Validation rejects missing target role.")


def test_analyze_short_jd():
    pdf = create_test_pdf("John Doe Software Engineer with React and Python skills.")
    res = client.post(
        "/api/analysis/analyze",
        headers=auth_headers,
        data={"target_role": "Backend Engineer", "job_description": "Short"},
        files={"file": ("resume.pdf", pdf, "application/pdf")},
    )
    assert res.status_code == 400
    assert "minimum 20 characters" in res.json()["detail"].lower()
    print("[PASS] Validation rejects short job description.")


def test_analyze_non_pdf():
    res = client.post(
        "/api/analysis/analyze",
        headers=auth_headers,
        data={"target_role": "Backend Engineer", "job_description": "We are looking for a senior backend engineer to join our team."},
        files={"file": ("resume.txt", b"Plain text resume", "text/plain")},
    )
    assert res.status_code == 400
    assert "pdf" in res.json()["detail"].lower()
    print("[PASS] Validation rejects non-PDF file upload.")


def test_analyze_missing_api_key():
    old_key = settings.GEMINI_API_KEY
    try:
        settings.GEMINI_API_KEY = ""
        pdf = create_test_pdf("Jane Doe - Senior Full Stack Engineer. 5 years building React and Python apps.")
        res = client.post(
            "/api/analysis/analyze",
            headers=auth_headers,
            data={
                "target_role": "Senior Full Stack Engineer",
                "job_description": "Looking for a Senior Full Stack Engineer skilled in React, Python, and SQLite.",
            },
            files={"file": ("resume.pdf", pdf, "application/pdf")},
        )
        assert res.status_code == 503
        assert "gemini api key is not configured" in res.json()["detail"].lower()
        print("[PASS] Missing API key cleanly returns HTTP 503.")
    finally:
        settings.GEMINI_API_KEY = old_key


def test_list_analyses_endpoint():
    res = client.get("/api/analysis", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    print(f"[PASS] GET /api/analysis returned 200 with {len(res.json())} items.")


def test_get_analysis_not_found():
    res = client.get("/api/analysis/unknown-id-12345", headers=auth_headers)
    assert res.status_code == 404
    print("[PASS] GET /api/analysis/{id} returned 404 for unknown ID.")


if __name__ == "__main__":
    test_analyze_missing_role()
    test_analyze_short_jd()
    test_analyze_non_pdf()
    test_analyze_missing_api_key()
    test_list_analyses_endpoint()
    test_get_analysis_not_found()
    print("\nALL API ENDPOINT INTEGRATION TESTS PASSED!")
