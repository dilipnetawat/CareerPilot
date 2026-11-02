import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class JobApplication(Base):
    """Stores candidate job application tracking records in SQLite and PostgreSQL."""
    __tablename__ = "job_applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    job_title = Column(String(255), nullable=False, index=True)
    role_category = Column(String(50), nullable=False, index=True)  # Python, Backend, Frontend, AI/ML, Full Stack, Other
    job_description_or_url = Column(Text, nullable=True)
    application_date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), nullable=False, default="Applied", index=True)  # Saved, Applied, Assessment, Interview, Offer, Rejected
    response_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="applications")
