"""
Shared utility functions for the Anime World API.

Covers pagination helpers, filtering, sorting, password utilities,
token generation, and miscellaneous data-transformation helpers.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import bcrypt
import jwt

from backend.config import get_settings
from backend.constants import (
    DEFAULT_PAGE_SIZE,
    JWT_ALGORITHM,
    MAX_PAGE_SIZE,
    SORT_FIELD_MAP,
)


# ---------------------------------------------------------------------------
# Password utilities
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Return a bcrypt hash of *password*."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the bcrypt *hashed* value."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ---------------------------------------------------------------------------
# JWT utilities
# ---------------------------------------------------------------------------

def create_access_token(user_id: str) -> str:
    """
    Create a short-lived JWT access token.

    Args:
        user_id: The user's UUID string.

    Returns:
        Encoded JWT string.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user_id,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Create a long-lived JWT refresh token.

    Args:
        user_id: The user's UUID string.

    Returns:
        Encoded JWT string.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user_id,
        "type": "refresh",
        "jti": str(uuid.uuid4()),  # Unique token ID for revocation
        "iat": now,
        "exp": now + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token.

    Raises:
        jwt.ExpiredSignatureError: Token has expired.
        jwt.InvalidTokenError: Token is malformed or signature is invalid.
    """
    settings = get_settings()
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[JWT_ALGORITHM])


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

def new_id() -> str:
    """Return a new UUID4 string."""
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Timestamp helpers
# ---------------------------------------------------------------------------

def utcnow_iso() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


def parse_iso(value: str) -> datetime:
    """Parse an ISO-8601 string (with or without trailing Z) to a datetime."""
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


# ---------------------------------------------------------------------------
# Pagination helpers
# ---------------------------------------------------------------------------

def clamp_page_size(limit: int) -> int:
    """Clamp *limit* to the allowed range [1, MAX_PAGE_SIZE]."""
    return max(1, min(limit, MAX_PAGE_SIZE))


def build_pagination_meta(
    total: int,
    page: int,
    page_size: int,
) -> Dict[str, Any]:
    """
    Build a standard pagination metadata dict.

    Args:
        total: Total number of matching documents.
        page: Current page number (1-based).
        page_size: Number of items per page.

    Returns:
        Dict with total, page, page_size, has_next, has_prev, total_pages.
    """
    total_pages = max(1, (total + page_size - 1) // page_size)
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": page < total_pages,
        "has_prev": page > 1,
        "total_pages": total_pages,
    }


# ---------------------------------------------------------------------------
# Sorting helpers
# ---------------------------------------------------------------------------

def resolve_sort(sort: str) -> Tuple[str, int]:
    """
    Map a sort key string to a (field, direction) tuple.

    Falls back to ("created_at", -1) for unknown keys.
    """
    return SORT_FIELD_MAP.get(sort, ("created_at", -1))


# ---------------------------------------------------------------------------
# Filtering helpers
# ---------------------------------------------------------------------------

def build_series_query(
    genre: Optional[str] = None,
    content_type: Optional[str] = None,
    status: Optional[str] = None,
    creator_id: Optional[str] = None,
    search: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build a MongoDB filter document for series queries.

    Args:
        genre: Filter by genre name (case-sensitive).
        content_type: Filter by content type (series/novel/movie).
        status: Filter by series status.
        creator_id: Filter by creator UUID.
        search: Full-text search on title (case-insensitive regex).

    Returns:
        MongoDB query dict.
    """
    query: Dict[str, Any] = {}
    if genre and genre.lower() != "all":
        query["genre"] = genre
    if content_type:
        query["content_type"] = content_type
    if status:
        query["status"] = status
    if creator_id:
        query["creator_id"] = creator_id
    if search:
        # Escape regex special characters from user input
        escaped = re.escape(search.strip())
        query["title"] = {"$regex": escaped, "$options": "i"}
    return query


# ---------------------------------------------------------------------------
# Document sanitisation
# ---------------------------------------------------------------------------

def strip_mongo_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Remove the MongoDB _id field from a document dict."""
    doc.pop("_id", None)
    return doc


def safe_user(user: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of *user* with sensitive fields removed."""
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def is_valid_hex_color(value: str) -> bool:
    """Return True if *value* is a valid CSS hex colour (#RGB or #RRGGBB)."""
    return bool(re.match(r"^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$", value))


def sanitise_filename(name: str) -> str:
    """Strip path separators and null bytes from a filename."""
    return re.sub(r"[/\\:\x00]", "_", name)
