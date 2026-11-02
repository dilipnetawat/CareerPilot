import sys
import os
sys.path.insert(0, os.path.abspath("."))
from unittest.mock import patch
import pymupdf
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.analysis import CareerAnalysisResponse
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


def test_full_analysis_workflow_with_mocked_gemini():
    mock_ai_response = CareerAnalysisResponse(
        overall_fit_score=88,
        score_rationale="Strong alignment in full stack technologies and system architecture.",
        profile_summary="Candidate has 4+ years of professional engineering experience with React and Python.",
        key_strengths=[
            {
                "title": "Full-Stack Development",
                "description": "Comprehensive experience in frontend and backend systems.",
                "resume_evidence": "Led React and FastAPI backend implementation serving 10k users.",
            }
        ],
        demonstrated_skills=[
            {
                "skill_name": "FastAPI",
                "status": "demonstrated",
                "importance": "critical",
                "supporting_evidence": "Developed microservices with FastAPI",
                "recommended_improvement": "Deepen knowledge in asyncio performance profiling",
            },
            {
                "skill_name": "TypeScript",
                "status": "demonstrated",
                "importance": "important",
                "supporting_evidence": "Migrated codebase to strict TypeScript",
                "recommended_improvement": "Leverage template literal types",
            },
        ],
        partially_demonstrated_skills=[
            {
                "skill_name": "PostgreSQL",
                "status": "partially_demonstrated",
                "importance": "important",
                "supporting_evidence": "Mentioned database querying in project summary",
                "recommended_improvement": "Highlight indexing strategies and query plan optimization",
            }
        ],
        skills_not_evidenced=[
            {
                "skill_name": "Kubernetes",
                "status": "not_evidenced",
                "importance": "nice_to_have",
                "supporting_evidence": "Not evidenced in resume",
                "recommended_improvement": "Complete a CKA certification or deploy minikube cluster",
            }
        ],
        important_job_requirements=[
            "Proficiency in Python and React",
            "Relational database design",
            "API performance tuning",
        ],
        prioritized_skill_gaps=[
            {
                "gap_name": "Container Orchestration",
                "severity": "medium",
                "impact": "Required for production deployment at enterprise scale",
                "explanation": "Resume shows application development but lacks container orchestration evidence.",
            }
        ],
        practical_recommendations=[
            "Quantify impact with metrics on existing projects",
            "Add a public portfolio link demonstrating containerized deployment",
        ],
        four_week_roadmap=[
            {
                "week_number": 1,
                "title": "Container Fundamentals",
                "focus": "Docker & multi-stage builds",
                "tasks": ["Write Dockerfile for FastAPI app", "Optimize image layers"],
                "expected_deliverable": "Production Docker container with non-root user",
            },
            {
                "week_number": 2,
                "title": "Orchestration & Helm",
                "focus": "Kubernetes manifests",
                "tasks": ["Deploy to local k3s", "Configure ingress and secrets"],
                "expected_deliverable": "Working Kubernetes deployment YAMLs",
            },
            {
                "week_number": 3,
                "title": "Database Optimization",
                "focus": "PostgreSQL indexes & transactions",
                "tasks": ["Analyze EXPLAIN queries", "Benchmark connection pools"],
                "expected_deliverable": "Query optimization case study",
            },
            {
                "week_number": 4,
                "title": "Portfolio & Interview Prep",
                "focus": "System design & portfolio polish",
                "tasks": ["Record demo video", "Prepare architecture diagrams"],
                "expected_deliverable": "Published GitHub repository and portfolio update",
            },
        ],
        portfolio_projects=[
            {
                "title": "High-Throughput Task Orchestrator",
                "description": "Distributed async job execution engine with FastAPI and Redis queues.",
                "skills_targeted": ["FastAPI", "Redis", "Docker", "Asynchronous Python"],
                "difficulty": "Intermediate",
                "suggested_deliverables": ["GitHub repo with CI/CD", "Architecture diagram in README"],
            },
            {
                "title": "Real-time Metrics Pipeline",
                "description": "Stream telemetry pipeline aggregating events with WebSockets and dashboard.",
                "skills_targeted": ["React", "TypeScript", "WebSockets"],
                "difficulty": "Intermediate",
                "suggested_deliverables": ["Live Vercel demo", "Automated Playwright tests"],
            },
            {
                "title": "Kubernetes-Native Microservice",
                "description": "Cloud-native service with automated health probes, HPA, and ConfigMaps.",
                "skills_targeted": ["Kubernetes", "DevOps", "Monitoring"],
                "difficulty": "Advanced",
                "suggested_deliverables": ["Helm chart repository", "Production deployment guide"],
            },
        ],
        disclaimer="AI estimate to guide preparation.",
    )

    pdf = create_test_pdf("John Doe - Senior Software Engineer with 5 years experience.")

    with patch("app.routers.analysis.analyze_career_fit", return_value=mock_ai_response):
        post_res = client.post(
            "/api/analysis/analyze",
            headers=auth_headers,
            data={
                "target_role": "Staff Full Stack Engineer",
                "job_description": "We are seeking a Staff Full Stack Engineer with extensive experience in React, Python, PostgreSQL, and Cloud infrastructure.",
            },
            files={"file": ("john_doe_resume.pdf", pdf, "application/pdf")},
        )

        assert post_res.status_code == 201
        data = post_res.json()
        assert "id" in data
        analysis_id = data["id"]
        assert data["target_role"] == "Staff Full Stack Engineer"
        assert data["fit_score"] == 88
        assert len(data["report"]["four_week_roadmap"]) == 4
        assert len(data["report"]["portfolio_projects"]) == 3
        print(f"[PASS] Analysis created and saved with ID: {analysis_id}")

        # Now test retrieving by ID
        get_res = client.get(f"/api/analysis/{analysis_id}", headers=auth_headers)
        assert get_res.status_code == 200
        fetched = get_res.json()
        assert fetched["id"] == analysis_id
        assert fetched["fit_score"] == 88
        assert fetched["report"]["profile_summary"] == mock_ai_response.profile_summary
        print("[PASS] Analysis retrieved by ID from SQLite.")

        # Test listing analyses
        list_res = client.get("/api/analysis", headers=auth_headers)
        assert list_res.status_code == 200
        items = list_res.json()
        assert any(item["id"] == analysis_id for item in items)
        print(f"[PASS] Analysis listed in history ({len(items)} items found).")


if __name__ == "__main__":
    test_full_analysis_workflow_with_mocked_gemini()
    print("\nALL WORKFLOW PERSISTENCE TESTS PASSED!")
