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


def test_cors_approved_careerpilot_origin_preflight():
    """Verify that approved CareerPilot domains pass preflight with credentials."""
    for origin in [
        "https://career-pilot-doncscz65-pixel-5edd96ca.vercel.app",
        "https://career-pilot.vercel.app",
    ]:
        res = client.options(
            "/api/auth/signup",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert res.status_code == 200, f"CORS preflight failed for {origin}: {res.status_code} {res.text}"
        assert res.headers.get("access-control-allow-origin") == origin
        assert res.headers.get("access-control-allow-credentials") == "true"
    print("[PASS] CORS preflight for approved CareerPilot domains succeeded.")


def test_cors_unrelated_vercel_origin_rejected():
    """Verify that unrelated origins (including other Vercel sites) are strictly rejected."""
    unrelated_origin = "https://unrelated-test-site.vercel.app"
    # Preflight OPTIONS request should be rejected (HTTP 400 from CORSMiddleware without allow-origin)
    res = client.options(
        "/api/auth/signup",
        headers={
            "Origin": unrelated_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert res.status_code == 400 or res.headers.get("access-control-allow-origin") != unrelated_origin
    assert res.headers.get("access-control-allow-origin") is None

    # Normal GET request with unapproved origin must not grant access-control-allow-origin
    get_res = client.get(
        "/api/health",
        headers={"Origin": unrelated_origin},
    )
    assert get_res.headers.get("access-control-allow-origin") is None
    print("[PASS] CORS correctly rejected unrelated Vercel origin without granting origin or credentials.")


def test_cors_origin_assembler_normalization():
    """Verify that assemble_cors_origins cleans trailing slashes, quotes, and empty values, and handles production fallbacks."""
    from app.config import Settings, APPROVED_PRODUCTION_ORIGINS
    raw_json = '["https://preview-1.vercel.app/", "https://preview-2.vercel.app", ""]'
    cleaned = Settings.assemble_cors_origins(raw_json)
    assert "https://preview-1.vercel.app" in cleaned
    assert "https://preview-2.vercel.app" in cleaned
    assert "https://preview-1.vercel.app/" not in cleaned
    assert "" not in cleaned

    # Fallback in development when empty
    fallback = Settings.assemble_cors_origins("")
    assert "http://localhost:5173" in fallback

    # Production settings should never authorize dev origins on empty or missing config
    prod_settings_missing = Settings(
        ENVIRONMENT="production",
        JWT_SECRET="a" * 32,
    )
    assert "http://localhost:5173" not in prod_settings_missing.CORS_ORIGINS
    assert "http://127.0.0.1:5173" not in prod_settings_missing.CORS_ORIGINS
    for approved in APPROVED_PRODUCTION_ORIGINS:
        assert approved in prod_settings_missing.CORS_ORIGINS

    prod_settings_empty = Settings(
        ENVIRONMENT="production",
        CORS_ORIGINS="",
        JWT_SECRET="a" * 32,
    )
    assert "http://localhost:5173" not in prod_settings_empty.CORS_ORIGINS
    for approved in APPROVED_PRODUCTION_ORIGINS:
        assert approved in prod_settings_empty.CORS_ORIGINS
    print("[PASS] assemble_cors_origins correctly normalizes origins and handles production fallbacks.")


if __name__ == "__main__":
    test_analyze_missing_role()
    test_analyze_short_jd()
    test_analyze_non_pdf()
    test_analyze_missing_api_key()
    test_list_analyses_endpoint()
    test_get_analysis_not_found()
    test_cors_approved_careerpilot_origin_preflight()
    test_cors_unrelated_vercel_origin_rejected()
    test_cors_origin_assembler_normalization()
    print("\nALL API ENDPOINT INTEGRATION TESTS PASSED!")
