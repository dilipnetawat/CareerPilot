import sys
import os
sys.path.insert(0, os.path.abspath("."))
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, init_db
from app.models.analysis import AnalysisReport
from app.models.interview import InterviewSession
from app.services.auth_service import ensure_demo_user_seeded

client = TestClient(app)


def test_real_live_gemini_interview():
    print("--- STARTING REAL LIVE GEMINI INTERVIEW VERIFICATION ---")
    init_db()
    db = SessionLocal()
    demo_user = ensure_demo_user_seeded(db)
    analysis = db.query(AnalysisReport).first()
    if analysis and not analysis.user_id:
        analysis.user_id = demo_user.id
        db.commit()
    db.close()

    assert analysis is not None, "No AnalysisReport found in database. Run phase 2 live test first."
    print(f"1. Using existing live AnalysisReport: ID={analysis.id}, Role={analysis.target_role}")

    # Login demo user
    auth_res = client.post("/api/auth/demo-login")
    assert auth_res.status_code == 200
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Start interview (real Gemini request for 5 questions)
    print("2. Requesting 5 tailored questions from Gemini AI...")
    start_res = client.post("/api/interviews/start", headers=headers, json={"analysis_id": analysis.id})
    assert start_res.status_code == 201, f"Failed to start interview: {start_res.text}"
    session = start_res.json()
    session_id = session["id"]
    questions = session["questions"]

    assert len(questions) == 5, f"Expected 5 questions, got {len(questions)}"
    print(f"3. Real Gemini generated exactly {len(questions)} questions for session {session_id}:")
    for q in questions:
        print(f"   - [Q{q['question_index'] + 1} | {q['category'].upper()} | {q['difficulty']}]: {q['question_text'][:80]}...")
        assert len(q["expected_indicators"]) > 0

    # 2. Answer Question 1 (real Gemini rubric evaluation)
    q1 = questions[0]
    print(f"\n4. Submitting realistic answer to Question 1 ({q1['category']})...")
    sample_answer = (
        "In our production microservices architecture, we isolate asynchronous I/O tasks using "
        "Python asyncio event loop and FastAPI non-blocking route handlers. For CPU-bound operations "
        "like heavy PDF parsing or data encryption, we offload processing to distributed background worker queues "
        "using Celery and Redis to prevent blocking the main ASGI server event loop. We also set up timeouts "
        "and connection pool caps on our PostgreSQL database to prevent connection starvation."
    )

    ans_res = client.post(
        f"/api/interviews/{session_id}/answer",
        headers=headers,
        json={"question_id": q1["id"], "user_answer": sample_answer},
    )
    assert ans_res.status_code == 201, f"Failed to evaluate answer: {ans_res.text}"
    evaluated_q = ans_res.json()
    eval_data = evaluated_q["answer"]

    print("5. Real Gemini Rubric Evaluation received:")
    print(f"   - Overall Score: {eval_data['score']}/100")
    print(f"   - Technical Accuracy: {eval_data['technical_accuracy']}/25")
    print(f"   - Relevance: {eval_data['relevance']}/20")
    print(f"   - Depth of Explanation: {eval_data['depth_of_explanation']}/20")
    print(f"   - Problem Solving: {eval_data['problem_solving']}/20")
    print(f"   - Communication Clarity: {eval_data['communication_clarity']}/15")
    print(f"   - What was done well: {eval_data['what_was_done_well'][:90]}...")
    print(f"   - Missing points count: {len(eval_data['missing_points'])}")
    print(f"   - Stronger answer example: {eval_data['stronger_answer_example'][:90]}...")

    # 3. Finalize interview session
    print("\n6. Finalizing interview session...")
    comp_res = client.post(f"/api/interviews/{session_id}/complete", headers=headers)
    assert comp_res.status_code == 200, f"Failed to complete interview: {comp_res.text}"
    completed = comp_res.json()
    assert completed["status"] == "completed"
    print(f"7. Final Interview Score: {completed['overall_score']}/100")
    print(f"8. Summary Feedback: {completed['summary'][:100]}...")
    print(f"9. Strongest Competencies: {completed['strongest_competencies']}")
    print(f"10. Recommendations: {completed['recommendations']}")

    # 4. Reopen interview session via GET
    print("\n11. Reopening interview session via GET /api/interviews/{session_id}...")
    reopen_res = client.get(f"/api/interviews/{session_id}", headers=headers)
    assert reopen_res.status_code == 200
    reopened = reopen_res.json()
    assert reopened["id"] == session_id
    assert reopened["status"] == "completed"
    assert reopened["questions"][0]["answer"]["score"] == eval_data["score"]
    print("12. Verified: Completed interview session reopens accurately with all data preserved in SQLite.")

    print("\n>>> LIVE GEMINI MOCK INTERVIEW ENGINE VERIFIED 100%! <<<")


if __name__ == "__main__":
    test_real_live_gemini_interview()
