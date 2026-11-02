import sys
import os
sys.path.insert(0, os.path.abspath("."))
import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, init_db
from app.models.analysis import AnalysisReport
from app.models.interview import InterviewSession, InterviewQuestion, InterviewAnswer
from app.schemas.interview import (
    GeneratedQuestionItem,
    AnswerEvaluationResponse,
    RubricBreakdown,
    FinalInterviewSummary,
)
from app.services.auth_service import ensure_demo_user_seeded, create_access_token, DEMO_USER_ID, DEMO_EMAIL

client = TestClient(app)

db_init = SessionLocal()
ensure_demo_user_seeded(db_init)
db_init.close()
demo_token = create_access_token(user_id=DEMO_USER_ID, email=DEMO_EMAIL)
auth_headers = {"Authorization": f"Bearer {demo_token}"}


def test_rubric_schema_validation():
    rubric = RubricBreakdown(
        technical_accuracy=22,
        relevance=18,
        depth_of_explanation=17,
        problem_solving=19,
        communication_clarity=14,
    )
    total = sum([
        rubric.technical_accuracy,
        rubric.relevance,
        rubric.depth_of_explanation,
        rubric.problem_solving,
        rubric.communication_clarity,
    ])
    assert total == 90

    eval_resp = AnswerEvaluationResponse(
        overall_score=total,
        rubric=rubric,
        what_was_done_well="Accurate explanation of ASGI architecture and async request lifecycle.",
        missing_points=["Did not mention connection pooling settings in SQLAlchemy"],
        incorrect_reasoning=None,
        improvement_suggestions=["Mention database session teardown in FastAPI dependencies"],
        stronger_answer_example="A senior engineer would explain the async event loop and connection pool sizing.",
        disclaimer="AI estimate.",
    )
    assert eval_resp.overall_score == 90
    print("[PASS] Rubric schema validation passed.")


def test_interview_workflow_mocked():
    init_db()
    db = SessionLocal()

    # 1. Create a dummy AnalysisReport
    analysis_id = str(uuid.uuid4())
    analysis = AnalysisReport(
        id=analysis_id,
        user_id=DEMO_USER_ID,
        target_role="Lead Software Architect",
        candidate_summary="Expert backend engineer with 8 years of Python and distributed systems experience.",
        fit_score=88,
        report_data={
            "profile_summary": "Expert backend engineer",
            "demonstrated_skills": [{"skill_name": "Python"}, {"skill_name": "FastAPI"}],
            "partially_demonstrated_skills": [{"skill_name": "Docker"}],
            "skills_not_evidenced": [{"skill_name": "Kubernetes"}],
            "prioritized_skill_gaps": [{"gap_name": "Cloud Native Orchestration"}],
        },
    )
    db.add(analysis)
    db.commit()

    mock_questions = [
        GeneratedQuestionItem(
            question_text="How do you handle asynchronous tasks and prevent blocking the FastAPI event loop under high load?",
            category="technical",
            difficulty="Hard",
            evaluation_criteria="Understanding of asyncio, Celery/Redis queues, and background tasks.",
            expected_indicators=["async/await keywords", "thread pools for CPU-bound work", "external task queues"],
        ),
        GeneratedQuestionItem(
            question_text="Describe a production outage caused by database connection starvation and how you resolved it.",
            category="practical",
            difficulty="Hard",
            evaluation_criteria="Diagnosis of connection leaks, pool configuration, and monitoring.",
            expected_indicators=["pool_size & max_overflow", "session lifecycle closure", "metrics/alerts"],
        ),
        GeneratedQuestionItem(
            question_text="How do you navigate a technical architectural disagreement within your engineering team?",
            category="behavioral",
            difficulty="Medium",
            evaluation_criteria="Empathy, data-driven prototyping, and aligning on team consensus.",
            expected_indicators=["RFC/design documents", "benchmarking", "disagree and commit"],
        ),
        GeneratedQuestionItem(
            question_text="What strategies would you use to migrate a monolithic SQLite database to a distributed PostgreSQL cluster?",
            category="technical",
            difficulty="Medium",
            evaluation_criteria="Dual writing, schema migrations, and zero-downtime cutover.",
            expected_indicators=["schema translation", "dual-write phase", "data backfill"],
        ),
        GeneratedQuestionItem(
            question_text="Tell me about a time you had to mentor a junior developer struggling with asynchronous programming.",
            category="behavioral",
            difficulty="Easy",
            evaluation_criteria="Coaching approach, patience, and clear conceptual explanations.",
            expected_indicators=["pair programming", "mental models of event loops", "code review"],
        ),
    ]

    mock_eval = AnswerEvaluationResponse(
        overall_score=85,
        rubric=RubricBreakdown(
            technical_accuracy=21,
            relevance=18,
            depth_of_explanation=17,
            problem_solving=16,
            communication_clarity=13,
        ),
        what_was_done_well="Clear explanation of the GIL and offloading heavy compute tasks to Celery workers.",
        missing_points=["Did not discuss Starlette BackgroundTasks for lightweight operations."],
        incorrect_reasoning=None,
        improvement_suggestions=["Clarify when to use in-process background tasks vs. standalone distributed workers."],
        stronger_answer_example="An ideal response contrasts asyncio.to_thread with distributed queues like Celery.",
        disclaimer="AI estimate.",
    )

    mock_summary = FinalInterviewSummary(
        overall_score=85,
        strongest_competencies=["Asynchronous Python Design", "Production Troubleshooting"],
        weakest_competencies=["Connection Pool Tuning", "Lightweight Task Offloading"],
        overall_feedback="Candidate demonstrated strong architectural maturity and clear technical communication.",
        actionable_recommendations=["Study Starlette background workers", "Practice zero-downtime database cutover scenarios"],
    )

    with patch("app.routers.interviews.generate_interview_questions", return_value=mock_questions), \
         patch("app.routers.interviews.evaluate_interview_answer", return_value=mock_eval), \
         patch("app.routers.interviews.synthesize_interview_final_report", return_value=mock_summary):

        # Test POST /api/interviews/start
        start_res = client.post("/api/interviews/start", json={"analysis_id": analysis_id}, headers=auth_headers)
        assert start_res.status_code == 201
        session_data = start_res.json()
        assert "id" in session_data
        session_id = session_data["id"]
        assert len(session_data["questions"]) == 5
        assert session_data["target_role"] == "Lead Software Architect"
        print(f"[PASS] Started interview session: {session_id} with 5 questions.")

        q1 = session_data["questions"][0]
        q1_id = q1["id"]

        # Test POST /api/interviews/{session_id}/answer with short answer (should fail 400 or 422)
        short_res = client.post(
            f"/api/interviews/{session_id}/answer",
            json={"question_id": q1_id, "user_answer": "Too short"},
            headers=auth_headers,
        )
        assert short_res.status_code in (400, 422)
        print("[PASS] Rejected short answer (<10 chars).")

        # Test POST /api/interviews/{session_id}/answer with valid answer
        valid_res = client.post(
            f"/api/interviews/{session_id}/answer",
            json={
                "question_id": q1_id,
                "user_answer": "I would use asyncio for non-blocking I/O operations and Celery with Redis for long CPU-bound tasks.",
            },
            headers=auth_headers,
        )
        assert valid_res.status_code == 201
        q_answered = valid_res.json()
        assert q_answered["answer"] is not None
        assert q_answered["answer"]["score"] == 85
        assert q_answered["answer"]["technical_accuracy"] == 21
        print("[PASS] Submitted answer and received rubric evaluation.")

        # Test duplicate submission for same question (should fail 400)
        dup_res = client.post(
            f"/api/interviews/{session_id}/answer",
            json={
                "question_id": q1_id,
                "user_answer": "Trying to submit a second answer for the same question.",
            },
            headers=auth_headers,
        )
        assert dup_res.status_code == 400
        assert "already been submitted" in dup_res.json()["detail"].lower()
        print("[PASS] Duplicate answer submission prevented.")

        # Test GET /api/interviews/{session_id} to reopen and verify progress
        reopen_res = client.get(f"/api/interviews/{session_id}", headers=auth_headers)
        assert reopen_res.status_code == 200
        reopened = reopen_res.json()
        assert reopened["status"] == "in_progress"
        assert reopened["questions"][0]["answer"] is not None
        assert reopened["questions"][1]["answer"] is None
        print("[PASS] Successfully reopened in-progress interview session.")

        # Test GET /api/interviews list
        list_res = client.get("/api/interviews", headers=auth_headers)
        assert list_res.status_code == 200
        items = list_res.json()
        assert any(i["id"] == session_id for i in items)
        print(f"[PASS] Listed interviews: {len(items)} found.")

        # Test POST /api/interviews/{session_id}/complete
        complete_res = client.post(f"/api/interviews/{session_id}/complete", headers=auth_headers)
        assert complete_res.status_code == 200
        completed = complete_res.json()
        assert completed["status"] == "completed"
        assert completed["overall_score"] == 85
        assert len(completed["strongest_competencies"]) > 0
        assert len(completed["recommendations"]) > 0
        print("[PASS] Finalized interview and generated summary report.")

        # Try answering completed interview (should fail 400)
        post_complete_res = client.post(
            f"/api/interviews/{session_id}/answer",
            json={
                "question_id": session_data["questions"][1]["id"],
                "user_answer": "Attempting to answer a completed interview.",
            },
            headers=auth_headers,
        )
        assert post_complete_res.status_code == 400
        print("[PASS] Prevented answer submission on finalized interview.")

    # Cleanup test records
    db.query(InterviewAnswer).delete()
    db.query(InterviewQuestion).delete()
    db.query(InterviewSession).delete()
    db.query(AnalysisReport).filter(AnalysisReport.id == analysis_id).delete()
    db.commit()
    db.close()
    print("\nALL INTERVIEW UNIT & WORKFLOW TESTS PASSED!")


if __name__ == "__main__":
    test_rubric_schema_validation()
    test_interview_workflow_mocked()
