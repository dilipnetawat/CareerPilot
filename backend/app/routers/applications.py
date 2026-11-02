import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.application import JobApplication
from app.models.user import User
from app.schemas.application import (
    CreateApplicationRequest,
    UpdateApplicationRequest,
    UpdateStatusRequest,
    JobApplicationResponse,
    ApplicationAnalyticsResponse,
    RoleCategoryAnalytics,
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/applications", tags=["Job Application Tracker & Analytics"])

VALID_CATEGORIES = ["Python", "Backend", "Frontend", "AI/ML", "Full Stack", "Other"]
VALID_STATUSES = ["Saved", "Applied", "Assessment", "Interview", "Offer", "Rejected"]
RESPONSE_STATUSES = {"Assessment", "Interview", "Offer", "Rejected"}


def _parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        clean = dt_str.replace("Z", "+00:00")
        if len(clean) == 10:  # YYYY-MM-DD
            clean += "T00:00:00+00:00"
        return datetime.fromisoformat(clean)
    except Exception:
        return datetime.now(timezone.utc)


def _format_datetime(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def _to_response(app: JobApplication) -> JobApplicationResponse:
    return JobApplicationResponse(
        id=app.id,
        company_name=app.company_name,
        job_title=app.job_title,
        role_category=app.role_category,
        job_description_or_url=app.job_description_or_url,
        application_date=_format_datetime(app.application_date) or datetime.now(timezone.utc).isoformat(),
        status=app.status,
        response_date=_format_datetime(app.response_date),
        notes=app.notes,
        created_at=_format_datetime(app.created_at) or datetime.now(timezone.utc).isoformat(),
        updated_at=_format_datetime(app.updated_at) or datetime.now(timezone.utc).isoformat(),
    )


@router.post(
    "",
    response_model=JobApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job application entry for authenticated user",
)
def create_application(
    payload: CreateApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates and persists a new job application record owned by authenticated user."""
    app_date = _parse_iso_datetime(payload.application_date) or datetime.now(timezone.utc)
    resp_date = _parse_iso_datetime(payload.response_date)

    if payload.status in RESPONSE_STATUSES and not resp_date:
        resp_date = datetime.now(timezone.utc)

    application = JobApplication(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        company_name=payload.company_name.strip(),
        job_title=payload.job_title.strip(),
        role_category=payload.role_category,
        job_description_or_url=payload.job_description_or_url.strip() if payload.job_description_or_url else None,
        application_date=app_date,
        status=payload.status,
        response_date=resp_date,
        notes=payload.notes.strip() if payload.notes else None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return _to_response(application)


@router.get(
    "",
    response_model=List[JobApplicationResponse],
    summary="List job applications for authenticated user with optional filters",
)
def list_applications(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by application status"),
    category_filter: Optional[str] = Query(None, alias="category", description="Filter by role category"),
    search: Optional[str] = Query(None, description="Search company name or job title"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves all tracked job applications belonging exclusively to the authenticated user."""
    query = db.query(JobApplication).filter(JobApplication.user_id == current_user.id)

    if status_filter and status_filter.strip():
        query = query.filter(JobApplication.status == status_filter.strip())

    if category_filter and category_filter.strip():
        query = query.filter(JobApplication.role_category == category_filter.strip())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                JobApplication.company_name.ilike(term),
                JobApplication.job_title.ilike(term),
            )
        )

    applications = query.order_by(JobApplication.application_date.desc(), JobApplication.created_at.desc()).all()
    return [_to_response(app) for app in applications]


@router.get(
    "/analytics",
    response_model=ApplicationAnalyticsResponse,
    summary="Calculate real application funnel and category conversion analytics for user",
)
def get_application_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Computes real recruitment funnel metrics and category performance from user's records."""
    all_apps = db.query(JobApplication).filter(JobApplication.user_id == current_user.id).all()
    total_apps = len(all_apps)

    status_counts: Dict[str, int] = {s: 0 for s in VALID_STATUSES}
    for app in all_apps:
        if app.status in status_counts:
            status_counts[app.status] += 1
        else:
            status_counts[app.status] = 1

    responses = [app for app in all_apps if app.status in RESPONSE_STATUSES or app.response_date is not None]
    response_count = len(responses)

    submitted_apps = [app for app in all_apps if app.status != "Saved"]
    effective_total = len(submitted_apps) if len(submitted_apps) > 0 else total_apps

    response_rate = round((response_count / effective_total * 100), 1) if effective_total > 0 else 0.0

    interview_apps = [app for app in all_apps if app.status in {"Interview", "Offer"}]
    interview_conversion_rate = round((len(interview_apps) / effective_total * 100), 1) if effective_total > 0 else 0.0

    offer_count = status_counts.get("Offer", 0)

    category_analytics: List[RoleCategoryAnalytics] = []
    category_grouped: Dict[str, List[JobApplication]] = {cat: [] for cat in VALID_CATEGORIES}
    for app in all_apps:
        cat = app.role_category if app.role_category in category_grouped else "Other"
        category_grouped[cat].append(app)

    for cat in VALID_CATEGORIES:
        apps_in_cat = category_grouped[cat]
        c_total = len(apps_in_cat)
        if c_total == 0:
            continue
        c_responses = sum(1 for a in apps_in_cat if a.status in RESPONSE_STATUSES or a.response_date is not None)
        c_rate = round((c_responses / c_total * 100), 1) if c_total > 0 else 0.0
        c_interviews = sum(1 for a in apps_in_cat if a.status in {"Interview", "Offer"})
        c_offers = sum(1 for a in apps_in_cat if a.status == "Offer")

        category_analytics.append(
            RoleCategoryAnalytics(
                role_category=cat,
                total_applications=c_total,
                responses=c_responses,
                response_rate=c_rate,
                interviews=c_interviews,
                offers=c_offers,
            )
        )

    category_analytics.sort(key=lambda x: x.total_applications, reverse=True)
    has_sufficient = total_apps >= 5

    if not has_sufficient:
        insight = (
            f"You currently have {total_apps} application(s) tracked in CareerPilot. "
            f"We recommend tracking at least 5 applications across your target tracks to unlock statistically "
            f"meaningful conversion patterns, category response rates, and personalized tactical guidance."
        )
    else:
        best_category = max(category_analytics, key=lambda x: x.response_rate) if category_analytics else None
        worst_category = min(category_analytics, key=lambda x: x.response_rate) if category_analytics else None

        insight_parts = [
            f"Out of {total_apps} tracked applications ({effective_total} submitted), "
            f"your overall response rate is {response_rate}% with an interview conversion rate of {interview_conversion_rate}%."
        ]

        if best_category and best_category.total_applications >= 2 and best_category.response_rate > 0:
            insight_parts.append(
                f"Your highest-performing track is '{best_category.role_category}' with a {best_category.response_rate}% response rate "
                f"across {best_category.total_applications} applications."
            )

        if worst_category and worst_category.total_applications >= 2 and worst_category != best_category:
            if worst_category.response_rate < response_rate:
                insight_parts.append(
                    f"Applications in '{worst_category.role_category}' show a lower response rate ({worst_category.response_rate}%). "
                    f"Consider tailoring your resume and completing your roadmap gaps in this domain before submitting additional applications."
                )

        if offer_count > 0:
            insight_parts.append(f"Congratulations on securing {offer_count} job offer(s)!")
        elif len(interview_apps) > 0:
            insight_parts.append("You have active interviews in progress. Focus on your Phase 3 Mock Interview prep.")
        else:
            insight_parts.append("Focus on aligning keywords from your Career Analysis reports to improve initial screening callback rates.")

        insight = " ".join(insight_parts)

    return ApplicationAnalyticsResponse(
        total_applications=total_apps,
        response_count=response_count,
        response_rate=response_rate,
        interview_conversion_rate=interview_conversion_rate,
        offer_count=offer_count,
        status_distribution=status_counts,
        category_analytics=category_analytics,
        has_sufficient_data=has_sufficient,
        insight_summary=insight,
    )


@router.get(
    "/{application_id}",
    response_model=JobApplicationResponse,
    summary="Get application details by ID for authenticated user",
)
def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a single job application record belonging to the authenticated user."""
    app = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job application '{application_id}' not found.",
        )
    return _to_response(app)


@router.put(
    "/{application_id}",
    response_model=JobApplicationResponse,
    summary="Update full job application details",
)
def update_application(
    application_id: str,
    payload: UpdateApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates candidate application record fields in SQLite."""
    app = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job application '{application_id}' not found.",
        )

    if payload.company_name is not None:
        app.company_name = payload.company_name.strip()
    if payload.job_title is not None:
        app.job_title = payload.job_title.strip()
    if payload.role_category is not None:
        app.role_category = payload.role_category
    if payload.job_description_or_url is not None:
        app.job_description_or_url = payload.job_description_or_url.strip() if payload.job_description_or_url else None
    if payload.application_date is not None:
        parsed_app_date = _parse_iso_datetime(payload.application_date)
        if parsed_app_date:
            app.application_date = parsed_app_date
    if payload.status is not None:
        app.status = payload.status
        if payload.status in RESPONSE_STATUSES and not app.response_date:
            app.response_date = datetime.now(timezone.utc)
    if payload.response_date is not None:
        app.response_date = _parse_iso_datetime(payload.response_date)
    if payload.notes is not None:
        app.notes = payload.notes.strip() if payload.notes else None

    app.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app)
    return _to_response(app)


@router.patch(
    "/{application_id}/status",
    response_model=JobApplicationResponse,
    summary="Quickly update the pipeline status of an application",
)
def update_application_status(
    application_id: str,
    payload: UpdateStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates the pipeline status and optionally records response date."""
    app = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job application '{application_id}' not found.",
        )

    app.status = payload.status
    if payload.response_date:
        app.response_date = _parse_iso_datetime(payload.response_date)
    elif payload.status in RESPONSE_STATUSES and not app.response_date:
        app.response_date = datetime.now(timezone.utc)

    app.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app)
    return _to_response(app)


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a job application from SQLite",
)
def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently deletes a job application record from SQLite."""
    app = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job application '{application_id}' not found.",
        )
    db.delete(app)
    db.commit()
    return None
