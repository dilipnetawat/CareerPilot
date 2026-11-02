import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class InterviewSession(Base):
    """Stores AI Mock Interview practice sessions."""
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    analysis_id = Column(String(36), ForeignKey("analysis_reports.id", ondelete="SET NULL"), nullable=True, index=True)
    target_role = Column(String(255), nullable=False, index=True)
    status = Column(String(50), default="in_progress", nullable=False)  # in_progress, completed
    overall_score = Column(Integer, nullable=True)  # Calculated upon completion (0-100)
    summary = Column(Text, nullable=True)
    strongest_competencies = Column(JSON, nullable=True)  # List[str]
    weakest_competencies = Column(JSON, nullable=True)    # List[str]
    recommendations = Column(JSON, nullable=True)         # List[str]
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="interviews")
    questions = relationship(
        "InterviewQuestion",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="InterviewQuestion.question_index",
    )


class InterviewQuestion(Base):
    """Stores individual generated questions for an interview session."""
    __tablename__ = "interview_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_index = Column(Integer, nullable=False)  # 0 to 4
    question_text = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # technical, practical, behavioral
    difficulty = Column(String(50), nullable=False)  # Easy, Medium, Hard
    evaluation_criteria = Column(Text, nullable=False)
    expected_indicators = Column(JSON, nullable=False)  # List[str]

    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship(
        "InterviewAnswer",
        back_populates="question",
        uselist=False,
        cascade="all, delete-orphan",
    )


class InterviewAnswer(Base):
    """Stores submitted candidate answers and their rubric evaluation."""
    __tablename__ = "interview_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("interview_questions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    user_answer = Column(Text, nullable=False)
    score = Column(Integer, nullable=False)  # 0 to 100
    technical_accuracy = Column(Integer, nullable=False)  # 0-25
    relevance = Column(Integer, nullable=False)  # 0-20
    depth_of_explanation = Column(Integer, nullable=False)  # 0-20
    problem_solving = Column(Integer, nullable=False)  # 0-20
    communication_clarity = Column(Integer, nullable=False)  # 0-15
    what_was_done_well = Column(Text, nullable=False)
    missing_points = Column(JSON, nullable=False)  # List[str]
    incorrect_reasoning = Column(Text, nullable=True)
    improvement_suggestions = Column(JSON, nullable=False)  # List[str]
    stronger_answer_example = Column(Text, nullable=False)
    disclaimer = Column(Text, default="Score is an AI-generated assessment to guide preparation and practice, not an absolute hiring verdict.")
    submitted_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    question = relationship("InterviewQuestion", back_populates="answer")
