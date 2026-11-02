import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class AnalysisReport(Base):
    """Stores completed career fit and skill gap analysis reports."""
    __tablename__ = "analysis_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    target_role = Column(String(255), nullable=False, index=True)
    candidate_summary = Column(Text, nullable=False)
    fit_score = Column(Integer, nullable=False)
    report_data = Column(JSON, nullable=False)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    user = relationship("User", back_populates="analyses")
