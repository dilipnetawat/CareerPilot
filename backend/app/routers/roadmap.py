import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.analysis import AnalysisReport
from app.models.interview import InterviewSession, InterviewQuestion
from app.models.roadmap import RoadmapTaskProgress, RoadmapRevision
from app.models.user import User
from app.schemas.roadmap import (
    RoadmapProgressResponse,
    WeeklyProgressBreakdown,
    TaskProgressItem,
    ToggleTaskRequest,
    AdaptivePlanRequest,
    AdaptivePlanResponse,
    RoadmapRevisionListItem,
)
from app.schemas.analysis import RoadmapWeek
from app.services.gemini_service import adapt_learning_roadmap
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/roadmap", tags=["Roadmap Progress & Adaptation"])


def ensure_roadmap_progress_initialized(db: Session, analysis: AnalysisReport) -> List[RoadmapTaskProgress]:
    """Ensures all tasks in analysis.report_data['four_week_roadmap'] exist in SQLite."""
    existing_tasks = (
        db.query(RoadmapTaskProgress)
        .filter(RoadmapTaskProgress.analysis_id == analysis.id)
        .all()
    )

    roadmap = analysis.report_data.get("four_week_roadmap", [])
    if not existing_tasks and roadmap:
        created = []
        for week in roadmap:
            w_num = week.get("week_number", 1)
            tasks = week.get("tasks", [])
            for t_idx, t_text in enumerate(tasks):
                task_obj = RoadmapTaskProgress(
                    id=str(uuid.uuid4()),
                    analysis_id=analysis.id,
                    week_number=w_num,
                    task_index=t_idx,
                    task_text=t_text,
                    is_completed=False,
                    created_at=datetime.now(timezone.utc),
                )
                db.add(task_obj)
                created.append(task_obj)
        db.commit()
        return created

    return existing_tasks


def calculate_progress_payload(db: Session, analysis: AnalysisReport) -> RoadmapProgressResponse:
    """Calculates overall and weekly task completion percentages using real SQLite records."""
    tasks = ensure_roadmap_progress_initialized(db, analysis)
    roadmap = analysis.report_data.get("four_week_roadmap", [])

    # Group tasks by (week_number, task_index)
    task_map: Dict[tuple, RoadmapTaskProgress] = {
        (t.week_number, t.task_index): t for t in tasks
    }

    weekly_breakdowns: List[WeeklyProgressBreakdown] = []
    total_tasks = 0
    total_completed = 0

    for week in roadmap:
        w_num = week.get("week_number", 1)
        w_title = week.get("title", f"Week {w_num}")
        w_focus = week.get("focus", "")
        w_deliverable = week.get("expected_deliverable", "")
        raw_tasks = week.get("tasks", [])

        week_items: List[TaskProgressItem] = []
        week_completed = 0

        for t_idx, t_text in enumerate(raw_tasks):
            t_obj = task_map.get((w_num, t_idx))
            is_comp = t_obj.is_completed if t_obj else False
            comp_at = t_obj.completed_at.isoformat() if (t_obj and t_obj.completed_at) else None
            t_id = t_obj.id if t_obj else str(uuid.uuid4())

            if is_comp:
                week_completed += 1

            week_items.append(
                TaskProgressItem(
                    id=t_id,
                    week_number=w_num,
                    task_index=t_idx,
                    task_text=t_text,
                    is_completed=is_comp,
                    completed_at=comp_at,
                )
            )

        w_total = len(raw_tasks)
        w_pct = round((week_completed / w_total * 100)) if w_total > 0 else 0

        total_tasks += w_total
        total_completed += week_completed

        weekly_breakdowns.append(
            WeeklyProgressBreakdown(
                week_number=w_num,
                title=w_title,
                focus=w_focus,
                total_tasks=w_total,
                completed_tasks=week_completed,
                percentage=w_pct,
                expected_deliverable=w_deliverable,
                tasks=week_items,
            )
        )

    overall_pct = round((total_completed / total_tasks * 100)) if total_tasks > 0 else 0

    revisions_count = (
        db.query(RoadmapRevision)
        .filter(RoadmapRevision.analysis_id == analysis.id)
        .count()
    )

    return RoadmapProgressResponse(
        analysis_id=analysis.id,
        overall_percentage=overall_pct,
        total_tasks=total_tasks,
        completed_tasks=total_completed,
        weekly_progress=weekly_breakdowns,
        revisions_count=revisions_count,
    )


@router.get(
    "/{analysis_id}/progress",
    response_model=RoadmapProgressResponse,
    summary="Get persistent learning roadmap progress and weekly completion metrics",
)
def get_roadmap_progress(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves SQLite-persisted roadmap progress for an analysis report."""
    analysis = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.id == analysis_id, AnalysisReport.user_id == current_user.id)
        .first()
    )
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career analysis '{analysis_id}' not found.",
        )

    return calculate_progress_payload(db, analysis)


@router.post(
    "/{analysis_id}/toggle-task",
    response_model=RoadmapProgressResponse,
    summary="Mark a roadmap task completed or undo completion in SQLite",
)
def toggle_roadmap_task(
    analysis_id: str,
    payload: ToggleTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates the persistent completion state and timestamp of a roadmap task."""
    analysis = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.id == analysis_id, AnalysisReport.user_id == current_user.id)
        .first()
    )
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career analysis '{analysis_id}' not found.",
        )

    ensure_roadmap_progress_initialized(db, analysis)

    task_obj = (
        db.query(RoadmapTaskProgress)
        .filter(
            RoadmapTaskProgress.analysis_id == analysis_id,
            RoadmapTaskProgress.week_number == payload.week_number,
            RoadmapTaskProgress.task_index == payload.task_index,
        )
        .first()
    )

    if not task_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task for Week {payload.week_number}, index {payload.task_index} was not found.",
        )

    task_obj.is_completed = payload.is_completed
    if payload.is_completed:
        task_obj.completed_at = datetime.now(timezone.utc)
    else:
        task_obj.completed_at = None

    task_obj.updated_at = datetime.now(timezone.utc)
    db.commit()

    return calculate_progress_payload(db, analysis)


@router.post(
    "/{analysis_id}/update-plan",
    response_model=AdaptivePlanResponse,
    summary="Adaptively adjust future roadmap tasks using Gemini AI",
)
def adapt_plan(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Uses completed tasks and mock interview findings to adjust future weeks."""
    analysis = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.id == analysis_id, AnalysisReport.user_id == current_user.id)
        .first()
    )
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career analysis '{analysis_id}' not found.",
        )

    tasks = ensure_roadmap_progress_initialized(db, analysis)

    completed_tasks = [t.task_text for t in tasks if t.is_completed]
    incomplete_tasks = [t.task_text for t in tasks if not t.is_completed]

    # Collect any mock interview findings associated with this analysis
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.analysis_id == analysis_id)
        .order_by(InterviewSession.created_at.desc())
        .limit(3)
        .all()
    )

    interview_findings: List[Dict[str, Any]] = []
    for s in sessions:
        for q in s.questions:
            if q.answer:
                interview_findings.append({
                    "question": q.question_text,
                    "category": q.category,
                    "score": q.answer.score,
                    "missing_points": q.answer.missing_points or [],
                    "improvement_suggestions": q.answer.improvement_suggestions or [],
                })

    current_roadmap = analysis.report_data.get("four_week_roadmap", [])
    original_gaps = analysis.report_data.get("prioritized_skill_gaps", [])

    # Call Gemini Adaptive Service
    gemini_output = adapt_learning_roadmap(
        target_role=analysis.target_role,
        original_gaps=original_gaps,
        completed_tasks=completed_tasks,
        incomplete_tasks=incomplete_tasks,
        interview_findings=interview_findings,
        current_roadmap=current_roadmap,
    )

    # Calculate revision number
    prev_rev = (
        db.query(RoadmapRevision)
        .filter(RoadmapRevision.analysis_id == analysis_id)
        .order_by(RoadmapRevision.revision_number.desc())
        .first()
    )
    new_rev_number = (prev_rev.revision_number + 1) if prev_rev else 1

    if gemini_output.adjusted:
        # Save revision record
        new_rev = RoadmapRevision(
            id=str(uuid.uuid4()),
            analysis_id=analysis_id,
            revision_number=new_rev_number,
            reason_for_change=gemini_output.reason_for_change,
            roadmap_data=[w.model_dump() for w in gemini_output.four_week_roadmap],
            created_at=datetime.now(timezone.utc),
        )
        db.add(new_rev)

        # Update AnalysisReport active roadmap
        analysis.report_data["four_week_roadmap"] = [w.model_dump() for w in gemini_output.four_week_roadmap]
        db.commit()

        # Update incomplete tasks in RoadmapTaskProgress to match the revised plan
        for week in gemini_output.four_week_roadmap:
            w_num = week.week_number
            for t_idx, t_text in enumerate(week.tasks):
                existing = (
                    db.query(RoadmapTaskProgress)
                    .filter(
                        RoadmapTaskProgress.analysis_id == analysis_id,
                        RoadmapTaskProgress.week_number == w_num,
                        RoadmapTaskProgress.task_index == t_idx,
                    )
                    .first()
                )
                if existing:
                    # Do not overwrite if completed
                    if not existing.is_completed:
                        existing.task_text = t_text
                else:
                    new_task = RoadmapTaskProgress(
                        id=str(uuid.uuid4()),
                        analysis_id=analysis_id,
                        week_number=w_num,
                        task_index=t_idx,
                        task_text=t_text,
                        is_completed=False,
                    )
                    db.add(new_task)
        db.commit()

    return AdaptivePlanResponse(
        adjusted=gemini_output.adjusted,
        reason_for_change=gemini_output.reason_for_change,
        revision_number=new_rev_number if gemini_output.adjusted else (prev_rev.revision_number if prev_rev else 0),
        four_week_roadmap=gemini_output.four_week_roadmap,
    )


@router.get(
    "/{analysis_id}/revisions",
    response_model=List[RoadmapRevisionListItem],
    summary="List all historical learning plan revisions for this analysis",
)
def list_revisions(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists saved roadmap revision history from SQLite."""
    analysis = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.id == analysis_id, AnalysisReport.user_id == current_user.id)
        .first()
    )
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career analysis '{analysis_id}' not found.",
        )

    revs = (
        db.query(RoadmapRevision)
        .filter(RoadmapRevision.analysis_id == analysis_id)
        .order_by(RoadmapRevision.revision_number.desc())
        .all()
    )
    return [
        RoadmapRevisionListItem(
            id=r.id,
            analysis_id=r.analysis_id,
            revision_number=r.revision_number,
            reason_for_change=r.reason_for_change,
            created_at=r.created_at.isoformat(),
        )
        for r in revs
    ]
