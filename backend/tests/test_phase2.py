import sys
import os
sys.path.insert(0, os.path.abspath("."))
import io
import pymupdf
from fastapi import HTTPException
from app.services.pdf_service import extract_resume_text
from app.models.analysis import AnalysisReport
from app.schemas.analysis import CareerAnalysisResponse
from app.database.session import SessionLocal, init_db


def create_test_pdf(text: str, page_count: int = 1) -> bytes:
    """Helper to generate a PDF in memory with selectable text."""
    doc = pymupdf.open()
    for _ in range(page_count):
        page = doc.new_page()
        page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_pdf_extraction_valid():
    sample_text = (
        "John Doe - Senior Software Engineer\n"
        "Experience with React, TypeScript, Python, FastAPI, and PostgreSQL.\n"
        "Built scalable microservices and led team of 5 developers.\n"
        "Education: B.S. in Computer Science."
    )
    pdf_bytes = create_test_pdf(sample_text, page_count=2)
    extracted = extract_resume_text(pdf_bytes, "resume.pdf")
    assert "John Doe" in extracted
    assert "FastAPI" in extracted
    print("[PASS] Valid PDF extraction succeeded.")


def test_pdf_extraction_empty_bytes():
    try:
        extract_resume_text(b"", "empty.pdf")
        assert False, "Should have raised HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "empty" in exc.detail.lower()
        print("[PASS] Empty file correctly rejected.")


def test_pdf_extraction_invalid_magic_bytes():
    try:
        extract_resume_text(b"This is just plain text, not a PDF file.", "test.pdf")
        assert False, "Should have raised HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "invalid file format" in exc.detail.lower()
        print("[PASS] Invalid PDF magic bytes rejected.")


def test_pdf_extraction_oversized():
    huge_bytes = b"%PDF-" + b"0" * (6 * 1024 * 1024)
    try:
        extract_resume_text(huge_bytes, "huge.pdf")
        assert False, "Should have raised HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "exceeds" in exc.detail.lower()
        print("[PASS] Oversized file (>5MB) rejected.")


def test_pdf_extraction_too_many_pages():
    pdf_bytes = create_test_pdf("Page content", page_count=16)
    try:
        extract_resume_text(pdf_bytes, "many_pages.pdf")
        assert False, "Should have raised HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "15" in exc.detail
        print("[PASS] Exceeding 15-page limit rejected.")


def test_pdf_extraction_scanned_or_sparse():
    # Only 10 characters, far below MIN_EXTRACTED_CHARS (50)
    pdf_bytes = create_test_pdf("Hi there!", page_count=1)
    try:
        extract_resume_text(pdf_bytes, "sparse.pdf")
        assert False, "Should have raised HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "no readable text" in exc.detail.lower()
        print("[PASS] Scanned/empty PDF without readable text rejected.")


def test_missing_api_key_handling():
    from app.services.gemini_service import get_gemini_client
    from app.config import settings

    old_key = settings.GEMINI_API_KEY
    try:
        settings.GEMINI_API_KEY = ""
        try:
            get_gemini_client()
            assert False, "Should have raised HTTPException"
        except HTTPException as exc:
            assert exc.status_code == 503
            assert "gemini api key is not configured" in exc.detail.lower()
            print("[PASS] Missing API key raises HTTP 503 with helpful instructions.")
    finally:
        settings.GEMINI_API_KEY = old_key


def test_database_persistence():
    init_db()
    db = SessionLocal()
    try:
        sample_report_data = {
            "overall_fit_score": 85,
            "score_rationale": "Strong full-stack foundations with minor cloud infrastructure gap.",
            "profile_summary": "Experienced full stack developer with React and Python expertise.",
            "key_strengths": [
                {
                    "title": "Full-Stack Web Development",
                    "description": "Proven track record in TypeScript and FastAPI",
                    "resume_evidence": "Built high throughput API in FastAPI with React UI",
                }
            ],
            "demonstrated_skills": [
                {
                    "skill_name": "FastAPI",
                    "status": "demonstrated",
                    "importance": "critical",
                    "supporting_evidence": "Built backend services with FastAPI",
                    "recommended_improvement": "Explore async streaming and background task queues",
                }
            ],
            "partially_demonstrated_skills": [],
            "skills_not_evidenced": [],
            "important_job_requirements": ["Python", "FastAPI", "React"],
            "prioritized_skill_gaps": [],
            "practical_recommendations": ["Highlight cloud deployment experience on AWS/GCP"],
            "four_week_roadmap": [
                {
                    "week_number": 1,
                    "title": "Containerization & Cloud",
                    "focus": "Docker & AWS ECS",
                    "tasks": ["Complete container tutorial", "Deploy sample app"],
                    "expected_deliverable": "Containerized application live on cloud",
                }
            ],
            "portfolio_projects": [
                {
                    "title": "Cloud Scale Service",
                    "description": "Distributed task queue with FastAPI and Redis",
                    "skills_targeted": ["FastAPI", "Redis", "Cloud"],
                    "difficulty": "Intermediate",
                    "suggested_deliverables": ["GitHub repository with CI/CD pipeline"],
                }
            ],
            "disclaimer": "AI estimate only.",
        }

        # Validate against Pydantic schema
        validated = CareerAnalysisResponse.model_validate(sample_report_data)
        assert validated.overall_fit_score == 85

        # Persist to database
        import uuid
        test_id = str(uuid.uuid4())
        record = AnalysisReport(
            id=test_id,
            target_role="Full Stack Engineer",
            candidate_summary=validated.profile_summary,
            fit_score=validated.overall_fit_score,
            report_data=validated.model_dump(),
        )
        db.add(record)
        db.commit()

        # Query back
        fetched = db.query(AnalysisReport).filter(AnalysisReport.id == test_id).first()
        assert fetched is not None
        assert fetched.target_role == "Full Stack Engineer"
        assert fetched.fit_score == 85
        assert fetched.report_data["overall_fit_score"] == 85

        # Clean up test record
        db.delete(fetched)
        db.commit()
        print("[PASS] Database persistence and retrieval verified.")
    finally:
        db.close()


if __name__ == "__main__":
    test_pdf_extraction_valid()
    test_pdf_extraction_empty_bytes()
    test_pdf_extraction_invalid_magic_bytes()
    test_pdf_extraction_oversized()
    test_pdf_extraction_too_many_pages()
    test_pdf_extraction_scanned_or_sparse()
    test_missing_api_key_handling()
    test_database_persistence()
    print("\nALL BACKEND PHASE 2 UNIT TESTS PASSED!")
