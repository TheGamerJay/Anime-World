"""
Authentication routes and dependency helpers.

Endpoints:
    POST /api/v1/auth/register
    POST /api/v1/auth/login
    POST /api/v1/auth/refresh
    POST /api/v1/auth/logout
    GET  /api/v1/auth/me
    PUT  /api/v1/auth/become-creator
    POST /api/v1/auth/forgot-password
    POST /api/v1/auth/reset-password
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.config import get_settings
from backend.constants import JWT_ALGORITHM
from backend.database import get_db
from backend.exceptions import (
    AccountLockedError,
    AuthenticationError,
    DuplicateError,
    ExpiredTokenError,
    InvalidCredentialsError,
    InvalidTokenError,
    UserNotFoundError,
)
from backend.models import (
    AuditLogRepository,
    PasswordResetRepository,
    RefreshTokenRepository,
    UserRepository,
)
from backend.schemas import (
    AuthResponse,
    ForgotPasswordRequest,
    MessageResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenRefreshResponse,
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
)
from backend.utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    new_id,
    safe_user,
    utcnow_iso,
    verify_password,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Auth dependencies
# ---------------------------------------------------------------------------

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db=Depends(get_db),
):
    """
    FastAPI dependency — resolve the authenticated user from the Bearer token.

    Raises AuthenticationError variants on any failure so the error
    middleware can convert them to the correct HTTP response.
    """
    if not credentials:
        raise AuthenticationError()
    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise ExpiredTokenError()
    except jwt.InvalidTokenError:
        raise InvalidTokenError()

    user_repo = UserRepository(db)
    user = await user_repo.find_by_id(payload["user_id"])
    if not user:
        raise UserNotFoundError()
    return user


async def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db=Depends(get_db),
):
    """
    FastAPI dependency — return the authenticated user or None.

    Used on endpoints that behave differently for authenticated vs
    anonymous visitors (e.g. personalised feeds).
    """
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_repo = UserRepository(db)
        return await user_repo.find_by_id(payload["user_id"])
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse, status_code=200)
async def register(data: UserRegisterRequest, request: Request, db=Depends(get_db)):
    """
    Register a new user account.

    Returns a JWT access token and the created user profile.
    Raises 400 if the email or username is already taken.
    """
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)

    if await user_repo.find_by_email(data.email):
        raise DuplicateError("Email already registered.")
    if await user_repo.find_by_username(data.username):
        raise DuplicateError("Username already taken.")

    user_id = new_id()
    user_doc = {
        "id": user_id,
        "username": data.username,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "avatar_color": "#00F0FF",
        "avatar_url": None,
        "avatar_type": None,
        "bio": "",
        "is_creator": False,
        "is_premium": False,
        "follower_count": 0,
        "following_count": 0,
        "total_earnings": 0.0,
        "balance": 0.0,
        "created_at": utcnow_iso(),
    }
    await user_repo.create(user_doc)

    token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    # Persist refresh token
    settings = get_settings()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    ).isoformat()
    rt_repo = RefreshTokenRepository(db)
    await rt_repo.store(user_id, refresh_token, expires_at)

    await audit_repo.log(
        user_id,
        "register",
        {"username": data.username, "email": data.email},
        ip_address=_get_ip(request),
    )

    logger.info("New user registered: %s", data.username)
    return AuthResponse(
        token=token,
        refresh_token=refresh_token,
        user=UserResponse(**safe_user(user_doc)),
    )


@router.post("/login", response_model=AuthResponse, status_code=200)
async def login(data: UserLoginRequest, request: Request, db=Depends(get_db)):
    """
    Authenticate with email and password.

    Returns a JWT access token and the user profile.
    Raises 401 on invalid credentials.
    """
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)

    user = await user_repo.find_by_email(data.email)
    if not user or not verify_password(data.password, user["password_hash"]):
        await audit_repo.log(
            user["id"] if user else "unknown",
            "login_failed",
            {"email": data.email},
            ip_address=_get_ip(request),
        )
        raise InvalidCredentialsError()

    token = create_access_token(user["id"])
    refresh_token = create_refresh_token(user["id"])

    settings = get_settings()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    ).isoformat()
    rt_repo = RefreshTokenRepository(db)
    await rt_repo.store(user["id"], refresh_token, expires_at)

    await audit_repo.log(
        user["id"], "login", {}, ip_address=_get_ip(request)
    )

    logger.info("User logged in: %s", user["username"])
    return AuthResponse(
        token=token,
        refresh_token=refresh_token,
        user=UserResponse(**safe_user(user)),
    )


@router.post("/refresh", response_model=TokenRefreshResponse, status_code=200)
async def refresh_token(data: RefreshTokenRequest, db=Depends(get_db)):
    """
    Exchange a valid refresh token for a new access + refresh token pair.

    The old refresh token is revoked (rotation strategy).
    """
    rt_repo = RefreshTokenRepository(db)
    stored = await rt_repo.find(data.refresh_token)
    if not stored:
        raise InvalidTokenError("Refresh token not found or already revoked.")

    try:
        payload = decode_token(data.refresh_token)
    except jwt.ExpiredSignatureError:
        await rt_repo.revoke(data.refresh_token)
        raise ExpiredTokenError("Refresh token has expired.")
    except jwt.InvalidTokenError:
        raise InvalidTokenError()

    if payload.get("type") != "refresh":
        raise InvalidTokenError("Not a refresh token.")

    user_id = payload["user_id"]
    # Rotate: revoke old, issue new pair
    await rt_repo.revoke(data.refresh_token)
    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)

    settings = get_settings()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    ).isoformat()
    await rt_repo.store(user_id, new_refresh, expires_at)

    return TokenRefreshResponse(token=new_access, refresh_token=new_refresh)


@router.post("/logout", response_model=MessageResponse, status_code=200)
async def logout(data: RefreshTokenRequest, db=Depends(get_db)):
    """Revoke the provided refresh token (client should discard the access token)."""
    rt_repo = RefreshTokenRepository(db)
    await rt_repo.revoke(data.refresh_token)
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserResponse, status_code=200)
async def get_me(user=Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserResponse(**safe_user(user))


@router.put("/become-creator", response_model=MessageResponse, status_code=200)
async def become_creator(user=Depends(get_current_user), db=Depends(get_db)):
    """Upgrade the authenticated user to creator status."""
    user_repo = UserRepository(db)
    await user_repo.update(user["id"], {"is_creator": True})
    logger.info("User became creator: %s", user["username"])
    return MessageResponse(message="You are now a creator!")


@router.post("/forgot-password", response_model=MessageResponse, status_code=200)
async def forgot_password(data: ForgotPasswordRequest, db=Depends(get_db)):
    """
    Initiate a password reset flow.

    Always returns the same message regardless of whether the email
    exists, to prevent user enumeration.
    """
    user_repo = UserRepository(db)
    pr_repo = PasswordResetRepository(db)

    user = await user_repo.find_by_email(data.email)
    if user:
        reset_token = new_id()
        await pr_repo.upsert(data.email, reset_token)
        # TODO: send email with reset link containing reset_token
        logger.info("Password reset requested for: %s", data.email)

    return MessageResponse(
        message="If an account exists with this email, you will receive a password reset link."
    )


@router.post("/reset-password", response_model=MessageResponse, status_code=200)
async def reset_password(data: ResetPasswordRequest, db=Depends(get_db)):
    """
    Complete a password reset using the token from the reset email.

    Raises 400 if the token is invalid or expired.
    """
    from backend.constants import PASSWORD_RESET_EXPIRY_HOURS
    from backend.utils import parse_iso

    pr_repo = PasswordResetRepository(db)
    user_repo = UserRepository(db)

    reset_doc = await pr_repo.find_by_token(data.token)
    if not reset_doc:
        from backend.exceptions import BadRequestError
        raise BadRequestError("Invalid or expired reset token.")

    created = parse_iso(reset_doc["created_at"])
    if datetime.now(timezone.utc) - created > timedelta(hours=PASSWORD_RESET_EXPIRY_HOURS):
        await pr_repo.delete(data.token)
        from backend.exceptions import BadRequestError
        raise BadRequestError("Reset token has expired.")

    from backend.constants import COL_USERS
    new_hash = hash_password(data.new_password)
    await db[COL_USERS].update_one(
        {"email": reset_doc["email"]},
        {"$set": {"password_hash": new_hash}},
    )
    await pr_repo.delete(data.token)
    return MessageResponse(message="Password reset successfully.")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"
