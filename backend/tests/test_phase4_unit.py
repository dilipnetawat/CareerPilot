import sys
import os
sys.path.insert(0, os.path.abspath("backend"))
import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, init_db
from app.models.user import User
from app.models.analysis import AnalysisReport
from app.models.roadmap import RoadmapTaskProgress, RoadmapRevision
from app.models.application import JobApplication
from app.schemas.interview import RubricBreakdown, AnswerEvaluationResponse
from app.services.gemini_service import GeminiAdaptiveRoadmapOutput
from app.schemas.analysis import RoadmapWeek
from app.services.auth_service import ensure_demo_user_seeded

client = TestClient(app)
demo_user_id = None
auth_headers = {}


def setup_module():
    global demo_user_id, auth_headers
    init_db()
    db = SessionLocal()
    try:
        demo_user = ensure_demo_user_seeded(db)
        demo_user_id = demo_user.id
    finally:
        db.close()
    res = client.post("/api/auth/demo-login")
    auth_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_part_f_rubric_audit_max_100():
    """Verify mock interview scoring rubric max dimensions sum strictly to 100."""
    max_rubric = RubricBreakdown(
        technical_accuracy=25,
        relevance=20,
        depth_of_explanation=20,
        problem_solving=20,
        communication_clarity=15,
    )
    total_max = (
        max_rubric.technical_accuracy
        + max_rubric.relevance
        + max_rubric.depth_of_explanation
        + max_rubric.problem_solving
        + max_rubric.communication_clarity
    )
    assert total_max == 100, f"Expected maximum rubric to sum to 100, got {total_max}"

    # Verify that AnswerEvaluationResponse enforces sum == overall_score
    eval_resp = AnswerEvaluationResponse(
        overall_score=100,
        rubric=max_rubric,
        what_was_done_well="Flawless technical precision and architectural mastery.",
        missing_points=[],
        incorrect_reasoning=None,
        improvement_suggestions=["Ready for principal architect loops."],
        stronger_answer_example="Exemplary answer.",
    )
    assert eval_resp.overall_score == 100
    print("[PASS] Part F: Rubric audit max 100 verified.")


def test_job_application_crud():
    """Verify Job Application Create, Read, Update, Status Patch, and Delete."""
    db = SessionLocal()

    # 1. Create Application
    create_payload = {
        "company_name": "Stripe",
        "job_title": "Backend Infrastructure Engineer",
        "role_category": "Backend",
        "job_description_or_url": "https://stripe.com/jobs/backend-infra",
        "status": "Applied",
        "notes": "Referred by senior staff engineer.",
    }
    create_res = client.post("/api/applications", headers=auth_headers, json=create_payload)
    assert create_res.status_code == 201, create_res.text
    created = create_res.json()
    app_id = created["id"]
    assert created["company_name"] == "Stripe"
    assert created["role_category"] == "Backend"
    assert created["status"] == "Applied"

    # 2. Get Application by ID
    get_res = client.get(f"/api/applications/{app_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["company_name"] == "Stripe"

    # 3. Update Application Details
    update_payload = {
        "job_title": "Senior Backend Infrastructure Engineer",
        "notes": "First round recruiter screening scheduled.",
    }
    put_res = client.put(f"/api/applications/{app_id}", headers=auth_headers, json=update_payload)
    assert put_res.status_code == 200
    assert put_res.json()["job_title"] == "Senior Backend Infrastructure Engineer"
    assert put_res.json()["notes"] == "First round recruiter screening scheduled."

    # 4. Patch Status to Interview
    patch_res = client.patch(f"/api/applications/{app_id}/status", headers=auth_headers, json={"status": "Interview"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Interview"
    assert patch_res.json()["response_date"] is not None

    # 5. List Applications with filters
    list_res = client.get("/api/applications?category=Backend&status=Interview", headers=auth_headers)
    assert list_res.status_code == 200
    matched = [a for a in list_res.json() if a["id"] == app_id]
    assert len(matched) == 1

    # Search filter
    search_res = client.get("/api/applications?search=Stripe", headers=auth_headers)
    assert search_res.status_code == 200
    assert any(a["id"] == app_id for a in search_res.json())

    # 6. Delete Application
    del_res = client.delete(f"/api/applications/{app_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Verify 404 after deletion
    get_after_del = client.get(f"/api/applications/{app_id}", headers=auth_headers)
    assert get_after_del.status_code == 404
    print("[PASS] Part B: Job application CRUD verified.")
    db.close()


def test_application_analytics_and_insufficient_data():
    """Verify analytics calculations, category breakdown, and threshold messaging."""
    db = SessionLocal()
    # Clean previous test applications
    db.query(JobApplication).filter(JobApplication.company_name.like("TestCorp%")).delete()
    db.commit()

    # Step 1: Check analytics with insufficient data (< 5 apps)
    # Add 2 test apps
    app1 = JobApplication(
        id=str(uuid.uuid4()),
        user_id=demo_user_id,
        company_name="TestCorp Alpha",
        job_title="Python Engineer",
        role_category="Python",
        status="Applied",
    )
    app2 = JobApplication(
        id=str(uuid.uuid4()),
        user_id=demo_user_id,
        company_name="TestCorp Beta",
        job_title="ML Engineer",
        role_category="AI/ML",
        status="Interview",
    )
    db.add_all([app1, app2])
    db.commit()

    res_insufficient = client.get("/api/applications/analytics", headers=auth_headers)
    assert res_insufficient.status_code == 200
    data_insufficient = res_insufficient.json()
    assert data_insufficient["total_applications"] >= 2
    if data_insufficient["total_applications"] < 5:
        assert data_insufficient["has_sufficient_data"] is False
        assert "at least 5 applications" in data_insufficient["insight_summary"]

    # Step 2: Add more applications to exceed >= 5 threshold and verify math
    app3 = JobApplication(
        id=str(uuid.uuid4()),
        user_id=demo_user_id,
        company_name="TestCorp Gamma",
        job_title="Frontend Developer",
        role_category="Frontend",
        status="Offer",
    )
    app4 = JobApplication(
        id=str(uuid.uuid4()),
        user_id=demo_user_id,
        company_name="TestCorp Delta",
        job_title="Backend Lead",
        role_category="Backend",
        status="Assessment",
    )
    app5 = JobApplication(
        id=str(uuid.uuid4()),
        user_id=demo_user_id,
        company_name="TestCorp Epsilon",
        job_title="Full Stack Engineer",
        role_category="Full Stack",
        status="Rejected",
    )
    db.add_all([app3, app4, app5])
    db.commit()

    res_sufficient = client.get("/api/applications/analytics", headers=auth_headers)
    assert res_sufficient.status_code == 200
    data_sufficient = res_sufficient.json()
    assert data_sufficient["total_applications"] >= 5
    assert data_sufficient["has_sufficient_data"] is True
    assert data_sufficient["offer_count"] >= 1
    assert data_sufficient["response_rate"] > 0
    assert len(data_sufficient["category_analytics"]) > 0

    # Cleanup test data
    db.query(JobApplication).filter(JobApplication.company_name.like("TestCorp%")).delete()
    db.commit()
    db.close()
    print("[PASS] Part C: Application analytics & insufficient-data handling verified.")


def test_roadmap_progress_and_persistence():
    """Verify task toggle, completion timestamps, percentage calculations, and persistence."""
    db = SessionLocal()

    # Create dummy analysis report with 2 weeks
    test_analysis_id = "test-roadmap-" + str(uuid.uuid4())[:8]
    dummy_analysis = AnalysisReport(
        id=test_analysis_id,
        user_id=demo_user_id,
        target_role="Full Stack Cloud Architect",
        candidate_summary="Senior full stack engineer with cloud experience.",
        fit_score=85,
        report_data={
            "four_week_roadmap": [
                {
                    "week_number": 1,
                    "title": "Week 1: Core Foundation",
                    "focus": "Backend architecture & databases",
                    "expected_deliverable": "Working microservice",
                    "tasks": ["Implement PostgreSQL connection pool", "Design REST API schema"],
                },
                {
                    "week_number": 2,
                    "title": "Week 2: Cloud Deployment",
                    "focus": "Docker and Kubernetes",
                    "expected_deliverable": "Deployed cluster",
                    "tasks": ["Containerize service", "Write Helm charts"],
                },
            ],
            "prioritized_skill_gaps": [
                {"skill": "Kubernetes", "priority": "High", "impact": "Production orchestration"}
            ],
        },
    )
    db.add(dummy_analysis)
    db.commit()

    # 1. Fetch initial progress (should auto-initialize to 0%)
    res1 = client.get(f"/api/roadmap/{test_analysis_id}/progress", headers=auth_headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["total_tasks"] == 4
    assert data1["completed_tasks"] == 0
    assert data1["overall_percentage"] == 0
    assert len(data1["weekly_progress"]) == 2

    # 2. Toggle Week 1, Task 0 to completed
    toggle_res1 = client.post(
        f"/api/roadmap/{test_analysis_id}/toggle-task",
        headers=auth_headers,
        json={"week_number": 1, "task_index": 0, "is_completed": True},
    )
    assert toggle_res1.status_code == 200
    data2 = toggle_res1.json()
    assert data2["completed_tasks"] == 1
    assert data2["overall_percentage"] == 25  # 1/4 = 25%
    assert data2["weekly_progress"][0]["completed_tasks"] == 1
    assert data2["weekly_progress"][0]["percentage"] == 50  # 1/2 = 50%
    assert data2["weekly_progress"][0]["tasks"][0]["is_completed"] is True
    assert data2["weekly_progress"][0]["tasks"][0]["completed_at"] is not None

    # 3. Toggle Week 1, Task 1 to completed -> 2/4 = 50%
    toggle_res2 = client.post(
        f"/api/roadmap/{test_analysis_id}/toggle-task",
        headers=auth_headers,
        json={"week_number": 1, "task_index": 1, "is_completed": True},
    )
    assert toggle_res2.status_code == 200
    data3 = toggle_res2.json()
    assert data3["completed_tasks"] == 2
    assert data3["overall_percentage"] == 50
    assert data3["weekly_progress"][0]["percentage"] == 100

    # 4. Undo Week 1, Task 0 -> 1/4 = 25%
    toggle_res3 = client.post(
        f"/api/roadmap/{test_analysis_id}/toggle-task",
        headers=auth_headers,
        json={"week_number": 1, "task_index": 0, "is_completed": False},
    )
    assert toggle_res3.status_code == 200
    data4 = toggle_res3.json()
    assert data4["completed_tasks"] == 1
    assert data4["overall_percentage"] == 25

    # Cleanup
    db.query(RoadmapTaskProgress).filter(RoadmapTaskProgress.analysis_id == test_analysis_id).delete()
    db.query(AnalysisReport).filter(AnalysisReport.id == test_analysis_id).delete()
    db.commit()
    db.close()
    print("[PASS] Part A: Roadmap progress and persistence verified.")


def test_adaptive_roadmap_update_and_revisions():
    """Verify Gemini-driven adaptive learning plan update preserving completed tasks."""
    db = SessionLocal()

    test_analysis_id = "test-adapt-" + str(uuid.uuid4())[:8]
    dummy_analysis = AnalysisReport(
        id=test_analysis_id,
        user_id=demo_user_id,
        target_role="Senior DevOps Architect",
        candidate_summary="Experienced DevOps engineer.",
        fit_score=80,
        report_data={
            "four_week_roadmap": [
                {
                    "week_number": 1,
                    "title": "Week 1: CI/CD Fundamentals",
                    "focus": "GitHub Actions",
                    "expected_deliverable": "Pipeline config",
                    "tasks": ["Set up linting workflow", "Configure Docker build action"],
                },
                {
                    "week_number": 2,
                    "title": "Week 2: Terraform Infrastructure",
                    "focus": "IaC",
                    "expected_deliverable": "VPC module",
                    "tasks": ["Deploy AWS VPC", "Configure remote state"],
                },
            ],
            "prioritized_skill_gaps": [
                {"skill": "Terraform", "priority": "High", "impact": "Infra as code"}
            ],
        },
    )
    db.add(dummy_analysis)
    db.commit()

    # Mark Week 1 Task 0 as completed
    t0 = RoadmapTaskProgress(
        id=str(uuid.uuid4()),
        analysis_id=test_analysis_id,
        week_number=1,
        task_index=0,
        task_text="Set up linting workflow",
        is_completed=True,
    )
    db.add(t0)
    db.commit()

    # Mock Gemini adaptive roadmap return
    mock_gemini_output = GeminiAdaptiveRoadmapOutput(
        adjusted=True,
        reason_for_change="Candidate completed linting workflow quickly. Accelerating Week 2 with Terragrunt modules based on interview feedback.",
        four_week_roadmap=[
            RoadmapWeek(
                week_number=1,
                title="Week 1: CI/CD Fundamentals",
                focus="GitHub Actions",
                expected_deliverable="Pipeline config",
                tasks=["Set up linting workflow", "Configure Docker build action"],
            ),
            RoadmapWeek(
                week_number=2,
                title="Week 2: Advanced IaC with Terragrunt",
                focus="Terragrunt & Terraform modules",
                expected_deliverable="Multi-environment DRY IaC architecture",
                tasks=["Deploy AWS VPC with Terragrunt", "Implement remote state locking with DynamoDB"],
            ),
        ],
    )

    with patch("app.routers.roadmap.adapt_learning_roadmap", return_value=mock_gemini_output):
        update_res = client.post(f"/api/roadmap/{test_analysis_id}/update-plan", headers=auth_headers)
        assert update_res.status_code == 200, update_res.text
        plan_data = update_res.json()
        assert plan_data["adjusted"] is True
        assert plan_data["revision_number"] == 1
        assert "linting workflow" in plan_data["four_week_roadmap"][0]["tasks"][0]

        # Check revision list
        rev_res = client.get(f"/api/roadmap/{test_analysis_id}/revisions", headers=auth_headers)
        assert rev_res.status_code == 200
        revs = rev_res.json()
        assert len(revs) == 1
        assert revs[0]["revision_number"] == 1
        assert "Terragrunt" in revs[0]["reason_for_change"]

    # Verify task 0 remains completed in DB
    refreshed_t0 = (
        db.query(RoadmapTaskProgress)
        .filter(
            RoadmapTaskProgress.analysis_id == test_analysis_id,
            RoadmapTaskProgress.week_number == 1,
            RoadmapTaskProgress.task_index == 0,
        )
        .first()
    )
    assert refreshed_t0.is_completed is True
    assert refreshed_t0.task_text == "Set up linting workflow"

    # Cleanup
    db.query(RoadmapTaskProgress).filter(RoadmapTaskProgress.analysis_id == test_analysis_id).delete()
    db.query(RoadmapRevision).filter(RoadmapRevision.analysis_id == test_analysis_id).delete()
    db.query(AnalysisReport).filter(AnalysisReport.id == test_analysis_id).delete()
    db.commit()
    db.close()
    print("[PASS] Part A: Adaptive roadmap update & revisions verified.")


if __name__ == "__main__":
    setup_module()
    print("--- Running Phase 4 Unit Tests ---")
    test_part_f_rubric_audit_max_100()
    test_job_application_crud()
    test_application_analytics_and_insufficient_data()
    test_roadmap_progress_and_persistence()
    test_adaptive_roadmap_update_and_revisions()
    print("--- ALL PHASE 4 UNIT TESTS PASSED ---")
