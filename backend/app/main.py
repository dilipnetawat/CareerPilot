from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import init_db, SessionLocal
from app.services.auth_service import ensure_demo_user_seeded
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.analysis import router as analysis_router
from app.routers.interviews import router as interviews_router
from app.routers.roadmap import router as roadmap_router
from app.routers.applications import router as applications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed demo user on startup (development only)
    init_db()
    if settings.ENVIRONMENT.lower() != "production" and settings.ENABLE_DEMO_LOGIN:
        db = SessionLocal()
        try:
            ensure_demo_user_seeded(db)
        finally:
            db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CareerPilot AI Backend API — AI Career Intelligence, Mock Interviews & Application Tracker",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(health_router)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(analysis_router, prefix=settings.API_V1_PREFIX)
app.include_router(interviews_router, prefix=settings.API_V1_PREFIX)
app.include_router(roadmap_router, prefix=settings.API_V1_PREFIX)
app.include_router(applications_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
        "auth": f"{settings.API_V1_PREFIX}/auth",
        "analysis": f"{settings.API_V1_PREFIX}/analysis",
        "interviews": f"{settings.API_V1_PREFIX}/interviews",
        "roadmap": f"{settings.API_V1_PREFIX}/roadmap",
        "applications": f"{settings.API_V1_PREFIX}/applications",
    }
