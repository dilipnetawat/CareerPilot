from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class SystemStatus(Base):
    """System status and initialization record table."""
    __tablename__ = "system_status"

    id = Column(Integer, primary_key=True, index=True)
    component = Column(String(50), unique=True, nullable=False)
    status = Column(String(50), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
