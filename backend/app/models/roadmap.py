import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base


class RoadmapTaskProgress(Base):
    """Tracks individual roadmap task completions persisted in SQLite."""
    __tablename__ = "roadmap_task_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String(36), ForeignKey("analysis_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)  # 1, 2, 3, 4
    task_index = Column(Integer, nullable=False)   # 0, 1, 2...
    task_text = Column(Text, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("analysis_id", "week_number", "task_index", name="uq_roadmap_analysis_week_task"),
    )


class RoadmapRevision(Base):
    """Stores history of adaptive learning plan adjustments."""
    __tablename__ = "roadmap_revisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String(36), ForeignKey("analysis_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_number = Column(Integer, nullable=False)
    reason_for_change = Column(Text, nullable=False)
    roadmap_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
