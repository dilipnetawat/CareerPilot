import logging
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings, BACKEND_DIR
from app.models.base import Base, SystemStatus

logger = logging.getLogger(__name__)


def get_engine_and_url():
    raw_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else "sqlite:///./careerpilot.db"

    # Normalize PostgreSQL URL for psycopg3 driver
    if raw_url.startswith("postgres://"):
        normalized_url = raw_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif raw_url.startswith("postgresql+psycopg2://"):
        normalized_url = raw_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    elif raw_url.startswith("postgresql://") and "+psycopg" not in raw_url:
        normalized_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    else:
        normalized_url = raw_url

    if normalized_url.startswith("sqlite"):
        if ":memory:" not in normalized_url:
            prefix = "sqlite:///"
            if normalized_url.startswith(prefix):
                db_path_str = normalized_url[len(prefix):]
                p = Path(db_path_str)
                is_win_abs = len(db_path_str) > 1 and db_path_str[1] == ":"
                is_unix_abs = db_path_str.startswith("/") or db_path_str.startswith("\\")
                if not (p.is_absolute() or is_win_abs or is_unix_abs):
                    canonical_file = (BACKEND_DIR / p).resolve()
                    normalized_url = f"sqlite:///{canonical_file.as_posix()}"

        engine_instance = create_engine(
            normalized_url,
            connect_args={"check_same_thread": False},
            echo=False,
        )
    else:
        # Conservative connection pooling for Supabase Session Pooler (Port 5432)
        # pool_size=3, max_overflow=2, pool_pre_ping=True, pool_recycle=300
        engine_instance = create_engine(
            normalized_url,
            pool_size=3,
            max_overflow=2,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False,
        )

    return engine_instance, normalized_url


engine, DATABASE_URL = get_engine_and_url()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and guarantees closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables and record system bootstrap state."""
    try:
        # In local SQLite development, ensure tables and backward-compatible columns exist
        if DATABASE_URL.startswith("sqlite"):
            Base.metadata.create_all(bind=engine)

            from sqlalchemy import inspect, text
            inspector = inspect(engine)
            with engine.connect() as conn:
                for table_name in ["analysis_reports", "interview_sessions", "job_applications"]:
                    if table_name in inspector.get_table_names():
                        cols = [c["name"] for c in inspector.get_columns(table_name)]
                        if "user_id" not in cols:
                            logger.info(f"Adding user_id column to {table_name}")
                            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN user_id VARCHAR(36)"))
                            conn.commit()

        db = SessionLocal()
        try:
            record = db.query(SystemStatus).filter(SystemStatus.component == "database").first()
            if not record:
                record = SystemStatus(component="database", status="initialized")
                db.add(record)
                db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
