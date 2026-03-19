"""
Pydantic request and response schemas.

Separating request models (what the client sends) from response models
(what the API returns) gives us fine-grained control over validation,
serialisation, and OpenAPI documentation.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from backend.constants import (
    DEFAULT_AVATAR_COLOR,
    DEFAULT_CONTENT_TYPE,
    DEFAULT_PAGE_SIZE,
    DEFAULT_SERIES_STATUS,
    GENRES,
    MAX_BIO_LENGTH,
    MAX_COMMENT_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    MAX_PAGE_SIZE,
    MAX_TAG_LENGTH,
    MAX_TAGS,
    MAX_TITLE_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    VALID_COMMENT_CONTENT_TYPES,
    VALID_CONTENT_TYPES,
    VALID_REPORT_CONTENT_TYPES,
    VALID_REPORT_REASONS,
    VALID_SERIES_STATUSES,
    VALID_SORT_OPTIONS,
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _strip(v: Optional[str]) -> Optional[str]:
    return v.strip() if v else v


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    """Payload for POST /api/v1/auth/register."""

    username: str = Field(..., min_length=3, max_length=30, examples=["sakura_fan"])
    email: EmailStr = Field(..., examples=["user@example.com"])
    password: str = Field(..., min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username may only contain letters, digits, and underscores.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v


class UserLoginRequest(BaseModel):
    """Payload for POST /api/v1/auth/login."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ---------------------------------------------------------------------------
# Auth response schemas
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """Safe user representation — never includes password_hash."""

    id: str
    username: str
    email: str
    avatar_color: str = DEFAULT_AVATAR_COLOR
    avatar_url: Optional[str] = None
    avatar_type: Optional[str] = None
    bio: str = ""
    is_creator: bool = False
    is_premium: bool = False
    follower_count: int = 0
    following_count: int = 0
    total_earnings: float = 0.0
    balance: float = 0.0
    created_at: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    refresh_token: Optional[str] = None
    user: UserResponse


class TokenRefreshResponse(BaseModel):
    token: str
    refresh_token: str


# ---------------------------------------------------------------------------
# Series schemas
# ---------------------------------------------------------------------------

class SeriesCreateRequest(BaseModel):
    """Payload for POST /api/v1/series."""

    title: str = Field(..., min_length=1, max_length=MAX_TITLE_LENGTH)
    description: str = Field(..., min_length=1, max_length=MAX_DESCRIPTION_LENGTH)
    genre: str = Field(..., min_length=1)
    custom_genre: Optional[str] = Field(None, max_length=50)
    content_type: str = Field(DEFAULT_CONTENT_TYPE)
    tags: List[str] = Field(default_factory=list)
    thumbnail_base64: Optional[str] = None
    cover_base64: Optional[str] = None
    status: str = Field(DEFAULT_SERIES_STATUS)

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        if v not in VALID_CONTENT_TYPES:
            return DEFAULT_CONTENT_TYPE
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_SERIES_STATUSES:
            return DEFAULT_SERIES_STATUS
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        if len(v) > MAX_TAGS:
            raise ValueError(f"Maximum {MAX_TAGS} tags allowed.")
        return [t[:MAX_TAG_LENGTH].strip() for t in v if t.strip()]


class SeriesUpdateRequest(BaseModel):
    """Payload for PATCH /api/v1/series/{id}."""

    title: Optional[str] = Field(None, min_length=1, max_length=MAX_TITLE_LENGTH)
    description: Optional[str] = Field(None, max_length=MAX_DESCRIPTION_LENGTH)
    genre: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    thumbnail_base64: Optional[str] = None
    cover_base64: Optional[str] = None


class SeriesResponse(BaseModel):
    id: str
    creator_id: str
    creator_name: str
    creator_avatar_color: str
    title: str
    description: str
    genre: str
    content_type: str
    tags: List[str] = []
    thumbnail_base64: Optional[str] = None
    cover_base64: Optional[str] = None
    episode_count: int = 0
    view_count: int = 0
    like_count: int = 0
    subscriber_count: int = 0
    is_featured: bool = False
    status: str
    created_at: str
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


class PaginatedSeriesResponse(BaseModel):
    data: List[SeriesResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


# ---------------------------------------------------------------------------
# Episode schemas
# ---------------------------------------------------------------------------

class EpisodeCreateRequest(BaseModel):
    """Payload for POST /api/v1/episodes."""

    series_id: str
    title: str = Field(..., min_length=1, max_length=MAX_TITLE_LENGTH)
    description: Optional[str] = Field("", max_length=MAX_DESCRIPTION_LENGTH)
    episode_number: int = Field(..., ge=1)
    video_url: Optional[str] = Field("", max_length=2048)
    content_text: Optional[str] = Field("", max_length=100_000)
    thumbnail_base64: Optional[str] = None
    is_premium: bool = False
    arc_name: Optional[str] = Field(None, max_length=100)


class EpisodeResponse(BaseModel):
    id: str
    series_id: str
    creator_id: str
    title: str
    description: str
    episode_number: int
    video_url: str
    content_text: str
    arc_name: Optional[str] = None
    thumbnail_base64: Optional[str] = None
    is_premium: bool
    view_count: int = 0
    like_count: int = 0
    created_at: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Comment schemas
# ---------------------------------------------------------------------------

class CommentCreateRequest(BaseModel):
    content_type: str
    content_id: str
    text: str = Field(..., min_length=1, max_length=MAX_COMMENT_LENGTH)
    parent_id: Optional[str] = None

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        if v not in VALID_COMMENT_CONTENT_TYPES:
            raise ValueError(f"content_type must be one of {VALID_COMMENT_CONTENT_TYPES}")
        return v

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class CommentResponse(BaseModel):
    id: str
    content_type: str
    content_id: str
    user_id: str
    username: str
    avatar_color: str
    text: str
    parent_id: Optional[str] = None
    like_count: int = 0
    created_at: str
    replies: List["CommentResponse"] = []
    reply_count: int = 0

    model_config = {"from_attributes": True}


CommentResponse.model_rebuild()


class PaginatedCommentsResponse(BaseModel):
    comments: List[CommentResponse]
    total: int
    page: int


# ---------------------------------------------------------------------------
# Report schemas
# ---------------------------------------------------------------------------

class ReportCreateRequest(BaseModel):
    content_type: str
    content_id: str
    reason: str
    details: Optional[str] = Field("", max_length=2000)

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        if v not in VALID_REPORT_CONTENT_TYPES:
            raise ValueError(f"content_type must be one of {VALID_REPORT_CONTENT_TYPES}")
        return v

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        if v not in VALID_REPORT_REASONS:
            raise ValueError(f"reason must be one of {VALID_REPORT_REASONS}")
        return v


# ---------------------------------------------------------------------------
# Notification schemas
# ---------------------------------------------------------------------------

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    message: str
    related_id: Optional[str] = None
    read: bool = False
    created_at: str

    model_config = {"from_attributes": True}


class NotificationsListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int


# ---------------------------------------------------------------------------
# Profile schemas
# ---------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    bio: Optional[str] = Field(None, max_length=MAX_BIO_LENGTH)
    avatar_color: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    avatar_type: Optional[str] = None


class SubProfileCreateRequest(BaseModel):
    """Create a named sub-profile (Netflix-style)."""

    name: str = Field(..., min_length=1, max_length=30)
    avatar_color: str = Field(DEFAULT_AVATAR_COLOR, max_length=20)


# ---------------------------------------------------------------------------
# Progress schemas
# ---------------------------------------------------------------------------

class ReadingProgressUpdateRequest(BaseModel):
    series_id: str
    episode_id: str
    progress: float = Field(..., ge=0.0, le=100.0)
    completed: bool = False


# ---------------------------------------------------------------------------
# Watch history schemas
# ---------------------------------------------------------------------------

class WatchHistoryUpdateRequest(BaseModel):
    anime_id: int
    episode_number: int
    title: str = Field(..., max_length=MAX_TITLE_LENGTH)
    anime_title: str = Field(..., max_length=MAX_TITLE_LENGTH)
    image_url: Optional[str] = Field(None, max_length=2048)
    progress: float = Field(0.0, ge=0.0, le=100.0)


# ---------------------------------------------------------------------------
# Watchlist schemas
# ---------------------------------------------------------------------------

class WatchlistAddRequest(BaseModel):
    anime_id: int
    title: str = Field(..., max_length=MAX_TITLE_LENGTH)
    image_url: Optional[str] = Field(None, max_length=2048)
    score: Optional[float] = None
    episodes: Optional[int] = None
    status: Optional[str] = None


# ---------------------------------------------------------------------------
# Pagination query params
# ---------------------------------------------------------------------------

class PaginationParams(BaseModel):
    page: int = Field(DEFAULT_PAGE_SIZE, ge=1)
    limit: int = Field(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE)

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.limit


# ---------------------------------------------------------------------------
# Generic responses
# ---------------------------------------------------------------------------

class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    database: str
    timestamp: str
