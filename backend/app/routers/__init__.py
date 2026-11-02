"""API routers package."""

from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.analysis import router as analysis_router
from app.routers.interviews import router as interviews_router
from app.routers.roadmap import router as roadmap_router
from app.routers.applications import router as applications_router

__all__ = [
    "health_router",
    "auth_router",
    "analysis_router",
    "interviews_router",
    "roadmap_router",
    "applications_router",
]
