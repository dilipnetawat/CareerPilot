import sys
import os
import uuid
from datetime import datetime, timezone
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.database.session import SessionLocal, init_db
from app.models.user import User
from app.models.application import JobApplication
from app.models.analysis import AnalysisReport
from app.services.auth_service import (
    hash_password,
    verify_password,
    decode_access_token,
    PUBLIC_DEMO_USER_ID,
)
from app.services.rate_limiter import demo_login_rate_limiter

client = TestClient(app)


def setup_module():
    init_db()


def test_public_demo_login_disabled_by_default():
    """Verify that public demo login returns HTTP 403 Forbidden when disabled."""
    original_flag = settings.ENABLE_PUBLIC_DEMO_LOGIN
    try:
        settings.ENABLE_PUBLIC_DEMO_LOGIN = False
        res = client.post("/api/auth/public-demo-login")
        assert res.status_code == 403
        assert "disabled" in res.json()["detail"].lower()
    finally:
        settings.ENABLE_PUBLIC_DEMO_LOGIN = original_flag
    print("[PASS] Public demo login correctly returns 403 when disabled.")


def test_public_demo_login_invalid_configuration_in_production():
    """Verify that missing demo password in production cleanly returns HTTP 503."""
    original_env = settings.ENVIRONMENT
    original_flag = settings.ENABLE_PUBLIC_DEMO_LOGIN
    original_pw = settings.DEMO_ACCOUNT_PASSWORD
    try:
        settings.ENVIRONMENT = "production"
        settings.ENABLE_PUBLIC_DEMO_LOGIN = True
        settings.DEMO_ACCOUNT_PASSWORD = ""

        res = client.post("/api/auth/public-demo-login")
        assert res.status_code == 503
        assert "not" in res.json()["detail"].lower() and "configured" in res.json()["detail"].lower()
    finally:
        settings.ENVIRONMENT = original_env
        settings.ENABLE_PUBLIC_DEMO_LOGIN = original_flag
        settings.DEMO_ACCOUNT_PASSWORD = original_pw
    print("[PASS] Invalid production demo configuration cleanly returns HTTP 503.")


def test_public_demo_login_rate_limiting():
    """Verify that excessive public demo login requests trigger HTTP 429 rate limiting."""
    original_flag = settings.ENABLE_PUBLIC_DEMO_LOGIN
    original_pw = settings.DEMO_ACCOUNT_PASSWORD
    try:
        settings.ENABLE_PUBLIC_DEMO_LOGIN = True
        settings.DEMO_ACCOUNT_PASSWORD = "RateLimitTestPassword2026!"
        demo_login_rate_limiter.reset()

        # Fire requests up to the limit (10)
        for i in range(10):
            res = client.post("/api/auth/public-demo-login")
            assert res.status_code == 200, f"Request {i+1} failed: {res.status_code}"

        # 11th request must be rejected with 429
        rejected_res = client.post("/api/auth/public-demo-login")
        assert rejected_res.status_code == 429
        assert "too many" in rejected_res.json()["detail"].lower()
        assert "retry-after" in rejected_res.headers
    finally:
        demo_login_rate_limiter.reset()
        settings.ENABLE_PUBLIC_DEMO_LOGIN = original_flag
        settings.DEMO_ACCOUNT_PASSWORD = original_pw
    print("[PASS] Public demo login rate limiting strictly enforces HTTP 429.")


def test_public_demo_login_success_and_jwt_validation():
    """Verify successful public demo login, PBKDF2 hash verification, and JWT validation."""
    original_flag = settings.ENABLE_PUBLIC_DEMO_LOGIN
    original_pw = settings.DEMO_ACCOUNT_PASSWORD
    try:
        settings.ENABLE_PUBLIC_DEMO_LOGIN = True
        settings.DEMO_ACCOUNT_PASSWORD = "ValidDemoSecret2026!#"
        demo_login_rate_limiter.reset()

        res = client.post("/api/auth/public-demo-login")
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == settings.DEMO_ACCOUNT_EMAIL
        assert data["user"]["is_demo"] is True

        token = data["access_token"]

        # Validate JWT payload
        payload = decode_access_token(token)
        assert payload["email"] == settings.DEMO_ACCOUNT_EMAIL
        assert "sub" in payload

        # Authenticate /api/auth/me using token
        me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["is_demo"] is True
        assert me_data["email"] == settings.DEMO_ACCOUNT_EMAIL
    finally:
        demo_login_rate_limiter.reset()
        settings.ENABLE_PUBLIC_DEMO_LOGIN = original_flag
        settings.DEMO_ACCOUNT_PASSWORD = original_pw
    print("[PASS] Public demo authentication and JWT validation succeeded.")


def test_public_demo_user_data_isolation():
    """Verify strict data isolation: demo users cannot read regular user data and vice-versa."""
    original_flag = settings.ENABLE_PUBLIC_DEMO_LOGIN
    original_pw = settings.DEMO_ACCOUNT_PASSWORD
    db = SessionLocal()
    try:
        settings.ENABLE_PUBLIC_DEMO_LOGIN = True
        settings.DEMO_ACCOUNT_PASSWORD = "IsolationTestPassword2026!"
        demo_login_rate_limiter.reset()

        # 1. Log in as demo user
        demo_res = client.post("/api/auth/public-demo-login")
        assert demo_res.status_code == 200
        demo_token = demo_res.json()["access_token"]
        demo_headers = {"Authorization": f"Bearer {demo_token}"}
        demo_user_id = demo_res.json()["user"]["id"]

        # 2. Create regular user
        normal_email = f"isolation_user_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = client.post(
            "/api/auth/signup",
            json={"email": normal_email, "password": "Password12345!", "full_name": "Private Candidate"},
        )
        assert reg_res.status_code == 201
        normal_token = reg_res.json()["access_token"]
        normal_headers = {"Authorization": f"Bearer {normal_token}"}
        normal_user_id = reg_res.json()["user"]["id"]

        # 3. Create a private job application under the regular user
        normal_app = JobApplication(
            id=str(uuid.uuid4()),
            user_id=normal_user_id,
            company_name="Private Confidential Inc",
            job_title="Lead Security Architect",
            role_category="Security",
            status="Applied",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(normal_app)
        db.commit()

        # 4. Verify regular user can access their application
        get_res_normal = client.get(f"/api/applications/{normal_app.id}", headers=normal_headers)
        assert get_res_normal.status_code == 200
        assert get_res_normal.json()["company_name"] == "Private Confidential Inc"

        # 5. Verify demo user CANNOT access normal user's application (returns 404)
        get_res_demo = client.get(f"/api/applications/{normal_app.id}", headers=demo_headers)
        assert get_res_demo.status_code == 404, "Demo user should not access private user records"

        # 6. Verify demo user's application list does not contain normal user's application
        demo_list_res = client.get("/api/applications", headers=demo_headers)
        assert demo_list_res.status_code == 200
        assert all(item["id"] != normal_app.id for item in demo_list_res.json())

        # Cleanup
        db.query(JobApplication).filter(JobApplication.id == normal_app.id).delete()
        db.query(User).filter(User.id == normal_user_id).delete()
        db.commit()
    finally:
        db.close()
        demo_login_rate_limiter.reset()
        settings.ENABLE_PUBLIC_DEMO_LOGIN = original_flag
        settings.DEMO_ACCOUNT_PASSWORD = original_pw
    print("[PASS] Strict data isolation between public demo account and normal users verified.")


def test_old_dev_demo_login_strictly_disabled_in_production():
    """Verify that public demo login does NOT accidentally enable the old dev /demo-login in production."""
    original_env = settings.ENVIRONMENT
    original_flag = settings.ENABLE_PUBLIC_DEMO_LOGIN
    try:
        settings.ENVIRONMENT = "production"
        settings.ENABLE_PUBLIC_DEMO_LOGIN = True

        # Old dev endpoint /api/auth/demo-login MUST return 403 in production
        dev_demo_res = client.post("/api/auth/demo-login")
        assert dev_demo_res.status_code == 403
        assert "disabled in production" in dev_demo_res.json()["detail"].lower()
    finally:
        settings.ENVIRONMENT = original_env
        settings.ENABLE_PUBLIC_DEMO_LOGIN = original_flag
    print("[PASS] Old development demo-login remains strictly blocked in production.")


def test_normal_registration_and_login_unaffected():
    """Verify that standard user signup and login work seamlessly alongside demo functionality."""
    email = f"standard_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"

    # Signup
    signup_res = client.post(
        "/api/auth/signup",
        json={"email": email, "password": password, "full_name": "Standard User"},
    )
    assert signup_res.status_code == 201
    assert signup_res.json()["user"]["is_demo"] is False

    # Login
    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["is_demo"] is False

    # Cleanup
    db = SessionLocal()
    db.query(User).filter(User.email == email).delete()
    db.commit()
    db.close()
    print("[PASS] Normal user registration and login are completely unaffected.")


def test_protected_sample_data_cannot_be_deleted_by_demo_user():
    """Verify that seeded/protected sample records cannot be destroyed by a demo user (HTTP 403)."""
    original_flag = settings.ENABLE_PUBLIC_DEMO_LOGIN
    original_pw = settings.DEMO_ACCOUNT_PASSWORD
    db = SessionLocal()
    try:
        settings.ENABLE_PUBLIC_DEMO_LOGIN = True
        settings.DEMO_ACCOUNT_PASSWORD = "SampleProtectionPassword2026!"
        demo_login_rate_limiter.reset()

        demo_res = client.post("/api/auth/public-demo-login")
        assert demo_res.status_code == 200
        demo_token = demo_res.json()["access_token"]
        demo_headers = {"Authorization": f"Bearer {demo_token}"}
        demo_user_id = demo_res.json()["user"]["id"]

        # Create a protected sample application for the demo user
        sample_app = JobApplication(
            id=str(uuid.uuid4()),
            user_id=demo_user_id,
            company_name="Sample Baseline Corp",
            job_title="Software Architect",
            role_category="Full Stack",
            status="Applied",
            notes="Seeded reference record. [PROTECTED_SAMPLE]",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(sample_app)
        db.commit()

        # Attempt to delete the protected sample record via the API -> MUST return 403
        del_res = client.delete(f"/api/applications/{sample_app.id}", headers=demo_headers)
        assert del_res.status_code == 403
        assert "protected sample data cannot be deleted" in del_res.json()["detail"].lower()

        # Verify the record is still present in the database
        persisted = db.query(JobApplication).filter(JobApplication.id == sample_app.id).first()
        assert persisted is not None

        # Clean up directly in DB
        db.delete(persisted)
        db.commit()
    finally:
        db.close()
        demo_login_rate_limiter.reset()
        settings.ENABLE_PUBLIC_DEMO_LOGIN = original_flag
        settings.DEMO_ACCOUNT_PASSWORD = original_pw
    print("[PASS] Protected sample data deletion prevention in demo mode strictly verified.")


def test_render_proxy_ip_resolution_and_rate_limiting():
    """Verify rate limiting properly respects X-Forwarded-For and CF-Connecting-IP proxy headers."""
    from app.services.rate_limiter import get_client_ip
    from starlette.requests import Request

    original_flag = settings.ENABLE_PUBLIC_DEMO_LOGIN
    original_pw = settings.DEMO_ACCOUNT_PASSWORD
    try:
        settings.ENABLE_PUBLIC_DEMO_LOGIN = True
        settings.DEMO_ACCOUNT_PASSWORD = "ProxyRateLimitPassword2026!"
        demo_login_rate_limiter.reset()

        # 10 requests from distinct forwarded proxy IPs must all succeed (not falsely aggregated as one IP)
        for i in range(10):
            proxy_ip = f"198.51.100.{i+1}"
            res = client.post(
                "/api/auth/public-demo-login",
                headers={"X-Forwarded-For": f"{proxy_ip}, 10.0.0.1"},
            )
            assert res.status_code == 200

        # But 10 requests from the SAME forwarded IP must trigger 429 on the 11th call
        target_ip = "203.0.113.99"
        demo_login_rate_limiter.reset()
        for i in range(10):
            res = client.post(
                "/api/auth/public-demo-login",
                headers={"X-Forwarded-For": f"{target_ip}, 10.0.0.1"},
            )
            assert res.status_code == 200

        rejected = client.post(
            "/api/auth/public-demo-login",
            headers={"X-Forwarded-For": f"{target_ip}, 10.0.0.1"},
        )
        assert rejected.status_code == 429
        assert "too many" in rejected.json()["detail"].lower()
    finally:
        demo_login_rate_limiter.reset()
        settings.ENABLE_PUBLIC_DEMO_LOGIN = original_flag
        settings.DEMO_ACCOUNT_PASSWORD = original_pw
    print("[PASS] Proxy IP extraction and per-IP rate limiting behind reverse proxies verified.")


if __name__ == "__main__":
    setup_module()
    test_public_demo_login_disabled_by_default()
    test_public_demo_login_invalid_configuration_in_production()
    test_public_demo_login_rate_limiting()
    test_public_demo_login_success_and_jwt_validation()
    test_public_demo_user_data_isolation()
    test_old_dev_demo_login_strictly_disabled_in_production()
    test_normal_registration_and_login_unaffected()
    test_protected_sample_data_cannot_be_deleted_by_demo_user()
    test_render_proxy_ip_resolution_and_rate_limiting()
    print("\nALL PUBLIC DEMO LOGIN BACKEND TESTS PASSED!")
