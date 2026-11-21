import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.models.user import User

# JWT Configuration
JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7

security = HTTPBearer(auto_error=False)

PUBLIC_DEMO_USER_ID = "00000000-0000-4000-8000-000000000001"
DEFAULT_PUBLIC_DEMO_NAME = "CareerPilot Demo Explorer"

DEMO_USER_ID = PUBLIC_DEMO_USER_ID
DEMO_EMAIL = "demo@careerpilot.ai"
DEMO_NAME = "Demo Candidate"


def is_demo_user(user: Optional[User]) -> bool:
    """Checks whether a User instance corresponds to the demo account."""
    if not user:
        return False
    configured_demo_email = (settings.DEMO_ACCOUNT_EMAIL or "demo@careerpilot.ai").strip().lower()
    return (
        user.id == PUBLIC_DEMO_USER_ID
        or user.id == DEMO_USER_ID
        or user.email.strip().lower() == configured_demo_email
        or user.email.strip().lower() == DEMO_EMAIL.lower()
    )


def ensure_public_demo_user(db: Session) -> User:
    """
    Idempotently ensures the dedicated public demo user exists with hashed credentials.
    Reads email and password from backend configuration / environment variables.
    Never overwrites an existing real account.
    """
    email = (settings.DEMO_ACCOUNT_EMAIL or "demo@careerpilot.ai").strip().lower()
    password = (settings.DEMO_ACCOUNT_PASSWORD or "").strip()

    if not password:
        # In non-production environments, allow fallback demo password if unset
        if settings.ENVIRONMENT.lower() != "production":
            password = (settings.DEMO_USER_PASSWORD or "").strip() or "CareerPilotDemo2026!"
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Public demo account credentials are not configured on this server.",
            )

    existing_user = db.query(User).filter(User.email == email).first()
    if not existing_user:
        # Check if the well-known PUBLIC_DEMO_USER_ID is free
        id_collision = db.query(User).filter(User.id == PUBLIC_DEMO_USER_ID).first()
        demo_id = PUBLIC_DEMO_USER_ID if not id_collision else str(secrets.token_hex(16))

        new_demo_user = User(
            id=demo_id,
            email=email,
            full_name=DEFAULT_PUBLIC_DEMO_NAME,
            hashed_password=hash_password(password),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        try:
            db.add(new_demo_user)
            db.commit()
            db.refresh(new_demo_user)
            return new_demo_user
        except Exception:
            db.rollback()
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                return existing_user
            raise

    # If the user exists and is confirmed as the demo account, sync password hash if changed
    if is_demo_user(existing_user):
        if not verify_password(password, existing_user.hashed_password):
            existing_user.hashed_password = hash_password(password)
            db.commit()
            db.refresh(existing_user)
        return existing_user

    # If an existing user has the demo email but is not a recognized demo user, do NOT overwrite
    return existing_user


def authenticate_public_demo_user(db: Session) -> User:
    """
    Validates public demo configuration and authenticates the demo account
    using standard PBKDF2 password verification without bypassing hashing.
    """
    if not settings.ENABLE_PUBLIC_DEMO_LOGIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public demo account access is currently disabled.",
        )

    password = (settings.DEMO_ACCOUNT_PASSWORD or "").strip()
    if not password:
        if settings.ENVIRONMENT.lower() != "production":
            password = (settings.DEMO_USER_PASSWORD or "").strip() or "CareerPilotDemo2026!"
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Public demo account is not properly configured.",
            )

    demo_user = ensure_public_demo_user(db)

    # Validate credentials via PBKDF2 verification
    if not verify_password(password, demo_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate demo account credentials.",
        )

    return demo_user


def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 iterations and salt."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored salt$hash in constant time."""
    try:
        salt_hex, key_hex = hashed_password.split("$")
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


def create_access_token(user_id: str, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Encodes a signed JWT access token for user authentication."""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=JWT_EXPIRE_DAYS))
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decodes and validates JWT token expiration and signature."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency that validates Bearer token and returns authenticated User."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication Bearer token. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user identity.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token was not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def ensure_demo_user_seeded(db: Session) -> Optional[User]:
    """Ensures a default demo user exists for seamless evaluation in development. Disabled in production."""
    if settings.ENVIRONMENT.lower() == "production" or not settings.ENABLE_DEMO_LOGIN:
        return None

    demo_password = (settings.DEMO_USER_PASSWORD or "").strip()
    if not demo_password:
        demo_password = secrets.token_urlsafe(24)

    demo_user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if not demo_user:
        demo_user = User(
            id=DEMO_USER_ID,
            email=DEMO_EMAIL,
            full_name=DEMO_NAME,
            hashed_password=hash_password(demo_password),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
    elif demo_password and not verify_password(demo_password, demo_user.hashed_password):
        demo_user.hashed_password = hash_password(demo_password)
        db.commit()
        db.refresh(demo_user)

    # Claim any legacy unowned records for the demo user
    from app.models.analysis import AnalysisReport
    from app.models.interview import InterviewSession
    from app.models.application import JobApplication

    db.query(AnalysisReport).filter(AnalysisReport.user_id.is_(None)).update({"user_id": demo_user.id})
    db.query(InterviewSession).filter(InterviewSession.user_id.is_(None)).update({"user_id": demo_user.id})
    db.query(JobApplication).filter(JobApplication.user_id.is_(None)).update({"user_id": demo_user.id})
    db.commit()

    return demo_user
