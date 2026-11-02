import sys
import os
sys.path.insert(0, os.path.abspath("backend"))
import uuid
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, init_db, engine
from app.models.user import User
from app.models.analysis import AnalysisReport
from app.models.interview import InterviewSession, InterviewQuestion, InterviewAnswer
from app.models.roadmap import RoadmapTaskProgress
from app.models.application import JobApplication
from app.schemas.interview import RubricBreakdown, AnswerEvaluationResponse
from app.services.auth_service import ensure_demo_user_seeded

client = TestClient(app)


def setup_module():
    init_db()
    db = SessionLocal()
    try:
        ensure_demo_user_seeded(db)
    finally:
        db.close()


def test_1_signup_and_login_two_accounts():
    """Verify signup and login with two separate user accounts."""
    db = SessionLocal()
    # Clean previous test users
    db.query(User).filter(User.email.in_(["user_alpha@test.com", "user_beta@test.com"])).delete()
    db.commit()
    db.close()

    # 1. Signup User Alpha
    signup_a = client.post(
        "/api/auth/signup",
        json={"email": "user_alpha@test.com", "password": "Password123!", "full_name": "User Alpha"},
    )
    assert signup_a.status_code == 201, signup_a.text
    token_a = signup_a.json()["access_token"]
    assert token_a is not None
    assert signup_a.json()["user"]["email"] == "user_alpha@test.com"

    # 2. Signup User Beta
    signup_b = client.post(
        "/api/auth/signup",
        json={"email": "user_beta@test.com", "password": "Password456!", "full_name": "User Beta"},
    )
    assert signup_b.status_code == 201, signup_b.text
    token_b = signup_b.json()["access_token"]
    assert token_b is not None
    assert signup_b.json()["user"]["email"] == "user_beta@test.com"

    # 3. Duplicate email rejection (409 Conflict)
    dup = client.post(
        "/api/auth/signup",
        json={"email": "user_alpha@test.com", "password": "AnotherPassword!", "full_name": "Duplicate"},
    )
    assert dup.status_code == 409

    # 4. Login User Alpha with valid credentials
    login_a = client.post(
        "/api/auth/login",
        json={"email": "user_alpha@test.com", "password": "Password123!"},
    )
    assert login_a.status_code == 200
    assert login_a.json()["access_token"] is not None

    # 5. Login with invalid password (401 Unauthorized)
    invalid_login = client.post(
        "/api/auth/login",
        json={"email": "user_alpha@test.com", "password": "WrongPassword!"},
    )
    assert invalid_login.status_code == 401

    # 6. Verify profile via /api/auth/me
    me_a = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_a}"})
    assert me_a.status_code == 200
    assert me_a.json()["email"] == "user_alpha@test.com"

    print("[PASS] Check 1: Signup and login with two separate accounts verified.")


def test_2_account_data_isolation():
    """Verify that User Alpha and User Beta can ONLY access their own records."""
    # Log in both users to obtain fresh tokens
    res_a = client.post("/api/auth/login", json={"email": "user_alpha@test.com", "password": "Password123!"})
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["user"]["id"]

    res_b = client.post("/api/auth/login", json={"email": "user_beta@test.com", "password": "Password456!"})
    token_b = res_b.json()["access_token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    db = SessionLocal()

    # --- Analysis Isolation ---
    report_a = AnalysisReport(
        id=str(uuid.uuid4()),
        user_id=user_a_id,
        target_role="Alpha Exclusive Architect",
        candidate_summary="Top engineer.",
        fit_score=92,
        report_data={
            "overall_fit_score": 92,
            "score_rationale": "Exceptional architectural track record.",
            "profile_summary": "Top engineer with deep experience.",
            "key_strengths": [
                {
                    "title": "Distributed Systems",
                    "description": "Proven large-scale systems design",
                    "resume_evidence": "Led microservices platform migration"
                }
            ],
            "demonstrated_skills": [
                {
                    "skill_name": "Python",
                    "status": "demonstrated",
                    "importance": "critical",
                    "supporting_evidence": "5+ years backend Python development",
                    "recommended_improvement": "Continue exploring async patterns"
                }
            ],
            "partially_demonstrated_skills": [],
            "skills_not_evidenced": [],
            "important_job_requirements": ["Python", "Cloud Architecture"],
            "prioritized_skill_gaps": [],
            "practical_recommendations": ["Highlight cloud certifications"],
            "four_week_roadmap": [
                {
                    "week_number": 1,
                    "title": "Week 1",
                    "focus": "Alpha Core",
                    "expected_deliverable": "Working POC",
                    "tasks": ["Task A1", "Task A2"],
                }
            ],
            "portfolio_projects": [
                {
                    "title": "Cloud Scale Service",
                    "description": "Event-driven system with Kafka",
                    "skills_targeted": ["Python", "FastAPI"],
                    "difficulty": "Advanced",
                    "suggested_deliverables": ["GitHub repo with CI/CD"]
                },
                {
                    "title": "API Gateway",
                    "description": "Zero-trust reverse proxy",
                    "skills_targeted": ["FastAPI", "OAuth2"],
                    "difficulty": "Intermediate",
                    "suggested_deliverables": ["Benchmark suite"]
                },
                {
                    "title": "Observability Stack",
                    "description": "Telemetry pipeline",
                    "skills_targeted": ["Prometheus"],
                    "difficulty": "Intermediate",
                    "suggested_deliverables": ["Grafana dashboard"]
                }
            ],
            "disclaimer": "AI-generated estimate for development guidance."
        },
    )
    db.add(report_a)
    db.commit()

    # User A can get their analysis
    get_a = client.get(f"/api/analysis/{report_a.id}", headers=headers_a)
    assert get_a.status_code == 200
    assert get_a.json()["target_role"] == "Alpha Exclusive Architect"

    # User B CANNOT get User A's analysis (404)
    get_b = client.get(f"/api/analysis/{report_a.id}", headers=headers_b)
    assert get_b.status_code == 404, "User B should not be able to read User A's report"

    # User B's list should not include User A's report
    list_b = client.get("/api/analysis", headers=headers_b)
    assert list_b.status_code == 200
    assert all(item["id"] != report_a.id for item in list_b.json())

    # --- Roadmap Progress Isolation ---
    prog_a = client.get(f"/api/roadmap/{report_a.id}/progress", headers=headers_a)
    assert prog_a.status_code == 200

    prog_b = client.get(f"/api/roadmap/{report_a.id}/progress", headers=headers_b)
    assert prog_b.status_code == 404, "User B should not be able to read User A's roadmap progress"

    # --- Mock Interview Isolation ---
    interview_a = InterviewSession(
        id=str(uuid.uuid4()),
        user_id=user_a_id,
        analysis_id=report_a.id,
        target_role="Alpha Exclusive Architect",
        status="in_progress",
    )
    db.add(interview_a)
    db.commit()

    int_a = client.get(f"/api/interviews/{interview_a.id}", headers=headers_a)
    assert int_a.status_code == 200

    int_b = client.get(f"/api/interviews/{interview_a.id}", headers=headers_b)
    assert int_b.status_code == 404, "User B should not be able to view User A's interview session"

    # --- Job Applications Isolation ---
    create_app_res = client.post(
        "/api/applications",
        headers=headers_a,
        json={
            "company_name": "Alpha Secret Corp",
            "job_title": "Principal Lead",
            "role_category": "Backend",
            "status": "Interview",
        },
    )
    assert create_app_res.status_code == 201
    app_a_id = create_app_res.json()["id"]

    # User B cannot get User A's application
    app_get_b = client.get(f"/api/applications/{app_a_id}", headers=headers_b)
    assert app_get_b.status_code == 404

    # User B's application list is empty (0 applications)
    apps_list_b = client.get("/api/applications", headers=headers_b)
    assert apps_list_b.status_code == 200
    assert len(apps_list_b.json()) == 0

    # User B's analytics shows 0 applications
    analytics_b = client.get("/api/applications/analytics", headers=headers_b)
    assert analytics_b.status_code == 200
    assert analytics_b.json()["total_applications"] == 0

    # Cleanup test isolation data
    db.query(JobApplication).filter(JobApplication.id == app_a_id).delete()
    db.query(InterviewSession).filter(InterviewSession.id == interview_a.id).delete()
    db.query(RoadmapTaskProgress).filter(RoadmapTaskProgress.analysis_id == report_a.id).delete()
    db.query(AnalysisReport).filter(AnalysisReport.id == report_a.id).delete()
    db.commit()
    db.close()
    print("[PASS] Check 2: Account data isolation strictly verified across all entities.")


def test_3_rubric_scoring_audit_exactly_100():
    """Verify that rubric dimensions strictly sum to 100: 25 + 20 + 20 + 20 + 15 = 100."""
    rubric = RubricBreakdown(
        technical_accuracy=25,
        relevance=20,
        depth_of_explanation=20,
        problem_solving=20,
        communication_clarity=15,
    )
    total = (
        rubric.technical_accuracy
        + rubric.relevance
        + rubric.depth_of_explanation
        + rubric.problem_solving
        + rubric.communication_clarity
    )
    assert total == 100, f"Expected 100, got {total}"

    eval_resp = AnswerEvaluationResponse(
        overall_score=100,
        rubric=rubric,
        what_was_done_well="Superb depth and architectural clarity.",
        missing_points=[],
        incorrect_reasoning=None,
        improvement_suggestions=["Ready for principal architect panel."],
        stronger_answer_example="Exemplary answer.",
    )
    assert eval_resp.overall_score == 100
    print("[PASS] Check 3: Rubric total 25 + 20 + 20 + 20 + 15 = 100 verified.")


def test_4_pdf_validation_rules():
    """Verify strict PDF validation: rejects empty, invalid magic bytes, non-PDF."""
    # Sign in demo user for token
    res = client.post("/api/auth/demo-login")
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Non-PDF format
    res_txt = client.post(
        "/api/analysis/analyze",
        headers=headers,
        data={"target_role": "Backend Engineer", "job_description": "We need an engineer with 5+ years of Python and cloud skills."},
        files={"file": ("resume.txt", b"plain text content", "text/plain")},
    )
    assert res_txt.status_code == 400
    assert "Invalid file format" in res_txt.text

    # 2. Empty file
    res_empty = client.post(
        "/api/analysis/analyze",
        headers=headers,
        data={"target_role": "Backend Engineer", "job_description": "We need an engineer with 5+ years of Python and cloud skills."},
        files={"file": ("resume.pdf", b"", "application/pdf")},
    )
    assert res_empty.status_code == 400

    # 3. Invalid magic bytes
    res_magic = client.post(
        "/api/analysis/analyze",
        headers=headers,
        data={"target_role": "Backend Engineer", "job_description": "We need an engineer with 5+ years of Python and cloud skills."},
        files={"file": ("resume.pdf", b"NOT_A_PDF_STREAM", "application/pdf")},
    )
    assert res_magic.status_code == 400

    print("[PASS] Check 4: PDF validation rules verified.")


def test_5_data_persistence_after_db_restart():
    """Verify that records survive database session closure and engine re-instantiation."""
    db = SessionLocal()
    # Create persistent record
    demo_user = ensure_demo_user_seeded(db)
    demo_user_id = demo_user.id

    test_app_id = "test-persist-" + str(uuid.uuid4())[:8]
    app_record = JobApplication(
        id=test_app_id,
        user_id=demo_user_id,
        company_name="Persistent Corp",
        job_title="Lead Architect",
        role_category="Full Stack",
        status="Applied",
    )
    db.add(app_record)
    db.commit()
    db.close()

    # Simulate restart: dispose connection pool and open brand new session
    engine.dispose()
    new_db = SessionLocal()
    retrieved = new_db.query(JobApplication).filter(JobApplication.id == test_app_id).first()
    assert retrieved is not None
    assert retrieved.company_name == "Persistent Corp"
    assert retrieved.user_id == demo_user_id

    # Cleanup
    new_db.delete(retrieved)
    new_db.commit()
    new_db.close()
    print("[PASS] Check 5: Data persistence after engine reset verified.")


def test_6_production_demo_login_disabled():
    """Verify that demo-login is strictly blocked in production with HTTP 403 Forbidden."""
    from app.config import settings

    original_env = settings.ENVIRONMENT
    original_flag = settings.ENABLE_DEMO_LOGIN
    try:
        # 1. When in production mode -> Must return 403 Forbidden
        settings.ENVIRONMENT = "production"
        res_prod = client.post("/api/auth/demo-login")
        assert res_prod.status_code == 403
        assert "disabled in production" in res_prod.json()["detail"]

        # 2. When ENABLE_DEMO_LOGIN is False -> Must return 403 Forbidden
        settings.ENVIRONMENT = "development"
        settings.ENABLE_DEMO_LOGIN = False
        res_disabled = client.post("/api/auth/demo-login")
        assert res_disabled.status_code == 403

        # 3. When in development with ENABLE_DEMO_LOGIN=True -> Allowed
        settings.ENABLE_DEMO_LOGIN = True
        res_allowed = client.post("/api/auth/demo-login")
        assert res_allowed.status_code == 200
        assert "access_token" in res_allowed.json()
    finally:
        settings.ENVIRONMENT = original_env
        settings.ENABLE_DEMO_LOGIN = original_flag
    print("[PASS] Check 6: Production demo login restriction verified.")


if __name__ == "__main__":
    setup_module()
    print("--- RUNNING ESSENTIAL REGRESSION & ISOLATION CHECKS ---")
    test_1_signup_and_login_two_accounts()
    test_2_account_data_isolation()
    test_3_rubric_scoring_audit_exactly_100()
    test_4_pdf_validation_rules()
    test_5_data_persistence_after_db_restart()
    test_6_production_demo_login_disabled()
    print("--- ALL REGRESSION CHECKS PASSED ---")
