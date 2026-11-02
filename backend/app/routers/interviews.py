import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.analysis import AnalysisReport
from app.models.interview import InterviewSession, InterviewQuestion, InterviewAnswer
from app.models.user import User
from app.schemas.interview import (
    StartInterviewRequest,
    SubmitAnswerRequest,
    InterviewAnswerResponse,
    InterviewQuestionResponse,
    InterviewSessionDetailResponse,
    InterviewSessionListItem,
)
from app.services.gemini_service import (
    generate_interview_questions,
    evaluate_interview_answer,
    synthesize_interview_final_report,
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/interviews", tags=["Interviews"])


def format_session_response(session: InterviewSession) -> InterviewSessionDetailResponse:
    """Format an InterviewSession ORM object into the detail response schema."""
    question_responses = []
    for q in sorted(session.questions, key=lambda x: x.question_index):
        answer_resp = None
        if q.answer:
            answer_resp = InterviewAnswerResponse(
                id=q.answer.id,
                question_id=q.answer.question_id,
                user_answer=q.answer.user_answer,
                score=q.answer.score,
                technical_accuracy=q.answer.technical_accuracy,
                relevance=q.answer.relevance,
                depth_of_explanation=q.answer.depth_of_explanation,
                problem_solving=q.answer.problem_solving,
                communication_clarity=q.answer.communication_clarity,
                what_was_done_well=q.answer.what_was_done_well,
                missing_points=q.answer.missing_points or [],
                incorrect_reasoning=q.answer.incorrect_reasoning,
                improvement_suggestions=q.answer.improvement_suggestions or [],
                stronger_answer_example=q.answer.stronger_answer_example,
                disclaimer=q.answer.disclaimer,
                submitted_at=q.answer.submitted_at.isoformat(),
            )

        question_responses.append(
            InterviewQuestionResponse(
                id=q.id,
                question_index=q.question_index,
                question_text=q.question_text,
                category=q.category,
                difficulty=q.difficulty,
                evaluation_criteria=q.evaluation_criteria,
                expected_indicators=q.expected_indicators or [],
                answer=answer_resp,
            )
        )

    return InterviewSessionDetailResponse(
        id=session.id,
        analysis_id=session.analysis_id,
        target_role=session.target_role,
        status=session.status,
        overall_score=session.overall_score,
        summary=session.summary,
        strongest_competencies=session.strongest_competencies,
        weakest_competencies=session.weakest_competencies,
        recommendations=session.recommendations,
        created_at=session.created_at.isoformat(),
        completed_at=session.completed_at.isoformat() if session.completed_at else None,
        questions=question_responses,
    )


@router.post(
    "/start",
    response_model=InterviewSessionDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start an AI Mock Interview based on an authenticated user's AnalysisReport",
)
def start_interview(
    payload: StartInterviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new mock interview session with 5 questions generated via Gemini."""
    analysis = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.id == payload.analysis_id, AnalysisReport.user_id == current_user.id)
        .first()
    )
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career analysis report with ID '{payload.analysis_id}' was not found.",
        )

    # Generate 5 questions via Gemini AI
    generated_questions = generate_interview_questions(
        target_role=analysis.target_role,
        report_data=analysis.report_data,
    )

    if not generated_questions or len(generated_questions) == 0:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate interview questions. Please try again.",
        )

    # Create InterviewSession owned by current_user
    session_id = str(uuid.uuid4())
    session = InterviewSession(
        id=session_id,
        user_id=current_user.id,
        analysis_id=analysis.id,
        target_role=analysis.target_role,
        status="in_progress",
        created_at=datetime.now(timezone.utc),
    )
    db.add(session)

    # Create InterviewQuestion items
    for idx, gq in enumerate(generated_questions[:5]):
        q_record = InterviewQuestion(
            id=str(uuid.uuid4()),
            session_id=session_id,
            question_index=idx,
            question_text=gq.question_text,
            category=gq.category,
            difficulty=gq.difficulty,
            evaluation_criteria=gq.evaluation_criteria,
            expected_indicators=gq.expected_indicators,
        )
        db.add(q_record)

    db.commit()
    db.refresh(session)

    return format_session_response(session)


@router.get(
    "",
    response_model=List[InterviewSessionListItem],
    summary="List all interview sessions belonging to the authenticated user",
)
def list_interviews(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves all past interview sessions for the authenticated user."""
    sessions = (
        db.query(InterviewSession)
        .options(joinedload(InterviewSession.questions).joinedload(InterviewQuestion.answer))
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(min(limit, 100))
        .all()
    )

    items = []
    for s in sessions:
        total_q = len(s.questions)
        answered_q = sum(1 for q in s.questions if q.answer is not None)
        items.append(
            InterviewSessionListItem(
                id=s.id,
                analysis_id=s.analysis_id,
                target_role=s.target_role,
                status=s.status,
                overall_score=s.overall_score,
                questions_total=total_q,
                questions_answered=answered_q,
                created_at=s.created_at.isoformat(),
                completed_at=s.completed_at.isoformat() if s.completed_at else None,
            )
        )
    return items


@router.get(
    "/{session_id}",
    response_model=InterviewSessionDetailResponse,
    summary="Get interview session details, questions, answers, and evaluations",
)
def get_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a specific interview session by ID, enforcing user ownership."""
    session = (
        db.query(InterviewSession)
        .options(joinedload(InterviewSession.questions).joinedload(InterviewQuestion.answer))
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session with ID '{session_id}' was not found.",
        )

    return format_session_response(session)


@router.post(
    "/{session_id}/answer",
    response_model=InterviewQuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit and evaluate an answer for an interview question",
)
def submit_answer(
    session_id: str,
    payload: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submits a text answer to a question, executes rubric evaluation via Gemini, and persists the result."""
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session '{session_id}' not found.",
        )

    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This interview session is already completed. Answers cannot be added to a finalized interview.",
        )

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == payload.question_id,
            InterviewQuestion.session_id == session_id,
        )
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question '{payload.question_id}' does not belong to session '{session_id}'.",
        )

    existing_answer = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == question.id).first()
    if existing_answer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An answer has already been submitted for this question.",
        )

    clean_answer = payload.user_answer.strip()
    if len(clean_answer) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a more substantive answer (minimum 10 characters).",
        )

    evaluation = evaluate_interview_answer(
        question_text=question.question_text,
        category=question.category,
        difficulty=question.difficulty,
        evaluation_criteria=question.evaluation_criteria,
        expected_indicators=question.expected_indicators or [],
        user_answer=clean_answer,
        target_role=session.target_role,
    )

    answer_record = InterviewAnswer(
        id=str(uuid.uuid4()),
        question_id=question.id,
        user_answer=clean_answer,
        score=evaluation.overall_score,
        technical_accuracy=evaluation.rubric.technical_accuracy,
        relevance=evaluation.rubric.relevance,
        depth_of_explanation=evaluation.rubric.depth_of_explanation,
        problem_solving=evaluation.rubric.problem_solving,
        communication_clarity=evaluation.rubric.communication_clarity,
        what_was_done_well=evaluation.what_was_done_well,
        missing_points=evaluation.missing_points,
        incorrect_reasoning=evaluation.incorrect_reasoning,
        improvement_suggestions=evaluation.improvement_suggestions,
        stronger_answer_example=evaluation.stronger_answer_example,
        disclaimer=evaluation.disclaimer,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(answer_record)
    db.commit()
    db.refresh(answer_record)
    db.refresh(question)

    return InterviewQuestionResponse(
        id=question.id,
        question_index=question.question_index,
        question_text=question.question_text,
        category=question.category,
        difficulty=question.difficulty,
        evaluation_criteria=question.evaluation_criteria,
        expected_indicators=question.expected_indicators or [],
        answer=InterviewAnswerResponse(
            id=answer_record.id,
            question_id=answer_record.question_id,
            user_answer=answer_record.user_answer,
            score=answer_record.score,
            technical_accuracy=answer_record.technical_accuracy,
            relevance=answer_record.relevance,
            depth_of_explanation=answer_record.depth_of_explanation,
            problem_solving=answer_record.problem_solving,
            communication_clarity=answer_record.communication_clarity,
            what_was_done_well=answer_record.what_was_done_well,
            missing_points=answer_record.missing_points or [],
            incorrect_reasoning=answer_record.incorrect_reasoning,
            improvement_suggestions=answer_record.improvement_suggestions or [],
            stronger_answer_example=answer_record.stronger_answer_example,
            disclaimer=answer_record.disclaimer,
            submitted_at=answer_record.submitted_at.isoformat(),
        ),
    )


@router.post(
    "/{session_id}/complete",
    response_model=InterviewSessionDetailResponse,
    summary="Finalize the interview session and generate the overall evaluation",
)
def complete_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Finalizes the interview, aggregates performance, synthesizes competencies, and records overall score."""
    session = (
        db.query(InterviewSession)
        .options(joinedload(InterviewSession.questions).joinedload(InterviewQuestion.answer))
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session '{session_id}' not found.",
        )

    answered_questions = [q for q in session.questions if q.answer is not None]
    if len(answered_questions) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete interview: no answers have been submitted yet.",
        )

    qa_summary_list = []
    total_score = 0
    for q in answered_questions:
        ans = q.answer
        total_score += ans.score
        qa_summary_list.append(
            {
                "question": q.question_text,
                "category": q.category,
                "score": ans.score,
                "user_answer": ans.user_answer,
                "what_was_done_well": ans.what_was_done_well,
                "missing_points": ans.missing_points,
            }
        )

    avg_score = round(total_score / len(answered_questions))

    try:
        final_summary = synthesize_interview_final_report(
            target_role=session.target_role,
            questions_with_answers=qa_summary_list,
        )
        session.overall_score = final_summary.overall_score or avg_score
        session.summary = final_summary.overall_feedback
        session.strongest_competencies = final_summary.strongest_competencies
        session.weakest_competencies = final_summary.weakest_competencies
        session.recommendations = final_summary.actionable_recommendations
    except Exception:
        session.overall_score = avg_score
        session.summary = f"Completed mock interview with an average score of {avg_score}/100 across {len(answered_questions)} evaluated questions."
        session.strongest_competencies = ["Technical articulation", "Role domain alignment"]
        session.weakest_competencies = ["Edge case handling", "Architectural depth"]
        session.recommendations = [
            "Review missing points identified across individual questions",
            "Practice articulating trade-offs concisely",
        ]

    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)

    return format_session_response(session)
