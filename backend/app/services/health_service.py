from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.config import settings


def check_system_health(db: Session) -> Dict[str, Any]:
    """Check health of the backend API and its database connection."""
    db_status = "unhealthy"
    try:
        # Verify active connection with lightweight query
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {str(exc)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.1.0",
    }
