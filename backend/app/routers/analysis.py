import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.analysis import AnalysisReport
from app.models.user import User
from app.schemas.analysis import (
    AnalysisListItem,
    AnalysisRecordResponse,
    CareerAnalysisResponse,
)
from app.services.gemini_service import analyze_career_fit
from app.services.pdf_service import extract_resume_text
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post(
    "/analyze",
    response_model=AnalysisRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze resume against target job description using Gemini AI",
)
async def analyze_resume(
    file: UploadFile = File(..., description="PDF resume file (max 5MB, <=15 pages)"),
    target_role: str = Form(..., description="Target job title / role"),
    job_description: str = Form(..., description="Full text of the target job description"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Processes uploaded resume PDF, extracts text, queries Gemini for career intelligence,
    and saves the structured report associated with the authenticated user.
    """
    clean_role = target_role.strip()
    if not clean_role or len(clean_role) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid target job role is required (minimum 2 characters).",
        )

    clean_jd = job_description.strip()
    if not clean_jd or len(clean_jd) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A genuine job description is required (minimum 20 characters) to perform career fit analysis.",
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a PDF file (.pdf).",
        )

    file_bytes = await file.read()
    resume_text = extract_resume_text(file_bytes, file.filename)

    analysis_result: CareerAnalysisResponse = analyze_career_fit(
        resume_text=resume_text,
        target_role=clean_role,
        job_description=clean_jd,
    )

    report_record = AnalysisReport(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        target_role=clean_role,
        candidate_summary=analysis_result.profile_summary,
        fit_score=analysis_result.overall_fit_score,
        report_data=analysis_result.model_dump(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    return AnalysisRecordResponse(
        id=report_record.id,
        target_role=report_record.target_role,
        fit_score=report_record.fit_score,
        candidate_summary=report_record.candidate_summary,
        created_at=report_record.created_at.isoformat(),
        report=analysis_result,
    )


@router.get(
    "/{analysis_id}",
    response_model=AnalysisRecordResponse,
    summary="Retrieve previously generated career fit analysis by ID",
)
def get_analysis_by_id(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve an authenticated user's saved analysis report. Enforces strict account isolation."""
    record = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.id == analysis_id, AnalysisReport.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis report '{analysis_id}' was not found.",
        )

    return AnalysisRecordResponse(
        id=record.id,
        target_role=record.target_role,
        fit_score=record.fit_score,
        candidate_summary=record.candidate_summary,
        created_at=record.created_at.isoformat(),
        report=CareerAnalysisResponse.model_validate(record.report_data),
    )


@router.get(
    "",
    response_model=List[AnalysisListItem],
    summary="List recent career analyses for authenticated user",
)
def list_recent_analyses(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List recent career analyses belonging exclusively to the authenticated user."""
    records = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.user_id == current_user.id)
        .order_by(AnalysisReport.created_at.desc())
        .limit(min(limit, 50))
        .all()
    )
    return [
        AnalysisListItem(
            id=r.id,
            target_role=r.target_role,
            fit_score=r.fit_score,
            candidate_summary=r.candidate_summary,
            created_at=r.created_at.isoformat(),
        )
        for r in records
    ]
