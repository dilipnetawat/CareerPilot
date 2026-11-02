from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.health_service import check_system_health

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health check endpoint")
def get_health(db: Session = Depends(get_db)):
    """Health check endpoint to verify backend service and database connectivity."""
    return check_system_health(db)
