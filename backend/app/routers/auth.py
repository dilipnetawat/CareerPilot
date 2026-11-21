import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.config import settings
from app.models.user import User
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    ensure_demo_user_seeded,
    is_demo_user,
    authenticate_public_demo_user,
)
from app.services.rate_limiter import demo_login_rate_limiter, get_client_ip

router = APIRouter(prefix="/auth", tags=["Authentication & User Accounts"])


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        created_at=user.created_at.isoformat() if user.created_at else datetime.now(timezone.utc).isoformat(),
        is_demo=is_demo_user(user),
    )


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account with secure password hashing",
)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Registers a new account. Rejects duplicate emails with 409 Conflict."""
    clean_email = payload.email.strip().lower()

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{clean_email}' already exists. Please log in.",
        )

    new_user = User(
        id=str(uuid.uuid4()),
        email=clean_email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id, new_user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_to_user_response(new_user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user credentials and issue signed JWT access token",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Validates user email and password. Returns 401 on invalid credentials."""
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_to_user_response(user),
    )


@router.post(
    "/demo-login",
    response_model=TokenResponse,
    summary="One-click demo evaluation login issuing a genuine authenticated JWT in development",
)
def demo_login(db: Session = Depends(get_db)):
    """Provides instant evaluation access in development. Strictly disabled in production."""
    if settings.ENVIRONMENT.lower() == "production" or not settings.ENABLE_DEMO_LOGIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Shared demo evaluation login is disabled in production to protect personal user data "
                "and prevent shared workspace modifications. Please create an account or sign in."
            ),
        )
    demo_user = ensure_demo_user_seeded(db)
    if not demo_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo evaluation login is currently disabled.",
        )
    token = create_access_token(demo_user.id, demo_user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_to_user_response(demo_user),
    )


@router.post(
    "/public-demo-login",
    response_model=TokenResponse,
    summary="Public one-click demo login returning a genuine authenticated JWT token",
)
def public_demo_login(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public demo account authentication endpoint.
    Protected by rate-limiting and the ENABLE_PUBLIC_DEMO_LOGIN configuration flag.
    Returns a normal valid JWT for exploring the application.
    """
    client_ip = get_client_ip(request)
    demo_login_rate_limiter.check(client_ip)

    demo_user = authenticate_public_demo_user(db)
    token = create_access_token(demo_user.id, demo_user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_to_user_response(demo_user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get profile of currently authenticated user",
)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieves authenticated user profile from verified JWT token."""
    return _to_user_response(current_user)
