import sys
import os
sys.path.insert(0, os.path.abspath("."))
import pymupdf
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, init_db
from app.models.analysis import AnalysisReport
from app.services.auth_service import ensure_demo_user_seeded

client = TestClient(app)


def generate_sample_pdf() -> bytes:
    """Generate a realistic test resume PDF in memory."""
    doc = pymupdf.open()
    page = doc.new_page()
    resume_text = """
    Alex Rivera
    Full-Stack Software Engineer | San Francisco, CA

    PROFESSIONAL SUMMARY:
    Full-stack engineer with 4+ years of hands-on experience designing, developing,
    and maintaining high-availability web applications and microservices. Expert in
    React, TypeScript, Python, FastAPI, and PostgreSQL.

    TECHNICAL SKILLS:
    - Frontend: React 18/19, TypeScript, Tailwind CSS, Next.js, Redux, Vite
    - Backend: Python 3.11+, FastAPI, Node.js, SQLAlchemy, RESTful APIs
    - Databases: PostgreSQL, SQLite, Redis
    - DevOps & Tools: Docker, Git, CI/CD GitHub Actions, Linux

    WORK EXPERIENCE:
    Senior Full-Stack Engineer | CloudPulse Inc. (2022 - Present)
    - Architected and built the core customer portal using React and TypeScript, increasing user engagement by 35%.
    - Designed and implemented 15+ REST microservices using Python and FastAPI, handling 1.2M daily API requests.
    - Optimized SQL queries and database indexes in PostgreSQL, reducing average query response time from 450ms to 85ms.
    - Led a team of 4 junior developers and conducted code reviews, sprint planning, and architectural reviews.

    Software Engineer | DataMetrics LLC (2020 - 2022)
    - Developed real-time analytics dashboards in React with responsive Tailwind CSS components.
    - Built internal ETL pipelines in Python to process and clean client survey data.
    - Wrote automated unit and integration tests achieving 88% test coverage.

    EDUCATION:
    B.S. in Computer Science | University of California, Davis (2016 - 2020)
    """
    page.insert_text((40, 60), resume_text, fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_live_career_analysis_workflow():
    print("--- STARTING LIVE GEMINI WORKFLOW VERIFICATION ---")
    init_db()
    db = SessionLocal()
    try:
        ensure_demo_user_seeded(db)
    finally:
        db.close()

    # Login demo user
    auth_res = client.post("/api/auth/demo-login")
    assert auth_res.status_code == 200
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    pdf_bytes = generate_sample_pdf()
    print(f"1. Generated realistic candidate resume PDF: {len(pdf_bytes)} bytes")

    target_role = "Senior Full-Stack Cloud Engineer"
    job_description = """
    We are seeking a Senior Full-Stack Cloud Engineer to lead our next-generation SaaS platform.
    Requirements:
    - 4+ years of professional experience with React and TypeScript.
    - Strong Python backend experience with modern async frameworks such as FastAPI.
    - Deep knowledge of relational database design (PostgreSQL) and caching strategies (Redis).
    - Hands-on experience with cloud infrastructure (AWS/GCP), container orchestration (Kubernetes), and CI/CD pipelines.
    - Strong communication, mentorship, and system architecture skills.
    """

    print("2. Making real POST /api/analysis/analyze request with genuine PDF and JD...")
    response = client.post(
        "/api/analysis/analyze",
        headers=headers,
        data={
            "target_role": target_role,
            "job_description": job_description,
        },
        files={
            "file": ("alex_rivera_resume.pdf", pdf_bytes, "application/pdf"),
        },
    )

    if response.status_code != 201:
        print(f"FAILED with status {response.status_code}: {response.text}")
        assert response.status_code == 201, f"Analysis failed: {response.text}"

    data = response.json()
    analysis_id = data["id"]
    fit_score = data["fit_score"]
    report = data["report"]

    print(f"3. Analysis created successfully with ID: {analysis_id}")
    print(f"4. Real Career Fit Score: {fit_score}/100")
    print(f"5. Candidate Profile Summary: {report['profile_summary'][:90]}...")
    print(f"6. Key Strengths returned: {len(report['key_strengths'])}")
    print(f"7. Demonstrated Skills returned: {len(report['demonstrated_skills'])}")
    print(f"8. Prioritized Gaps returned: {len(report['prioritized_skill_gaps'])}")
    print(f"9. 4-Week Roadmap Weeks returned: {len(report['four_week_roadmap'])}")
    print(f"10. Recommended Portfolio Projects: {len(report['portfolio_projects'])}")

    # Verify SQLite database persistence directly
    db = SessionLocal()
    try:
        record = db.query(AnalysisReport).filter(AnalysisReport.id == analysis_id).first()
        assert record is not None, "Report was not found in SQLite database!"
        assert record.fit_score == fit_score
        assert record.target_role == target_role
        print("11. Verified: Report is successfully persisted in SQLite database.")
    finally:
        db.close()

    # Verify retrieval via GET /api/analysis/{id}
    get_res = client.get(f"/api/analysis/{analysis_id}", headers=headers)
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["id"] == analysis_id
    assert retrieved["report"]["overall_fit_score"] == fit_score
    print("12. Verified: Report successfully retrieved via GET /api/analysis/{analysis_id}.")

    # Verify listing via GET /api/analysis
    list_res = client.get("/api/analysis", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(i["id"] == analysis_id for i in items)
    print(f"13. Verified: Report is present in recent analyses list ({len(items)} items).")

    print("\n>>> LIVE GEMINI INTEGRATION & SQLITE PERSISTENCE VERIFIED 100%! <<<")


if __name__ == "__main__":
    test_live_career_analysis_workflow()
