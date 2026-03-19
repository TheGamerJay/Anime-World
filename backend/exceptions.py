"""
Custom exception classes for the Anime World API.

Using typed exceptions instead of bare HTTPException throughout the
business logic layer keeps route handlers clean and makes error
behaviour easy to test in isolation.
"""

from typing import Any, Dict, Optional


class AppException(Exception):
    """Base class for all application-level exceptions."""

    status_code: int = 500
    detail: str = "An unexpected error occurred."
    headers: Optional[Dict[str, str]] = None

    def __init__(
        self,
        detail: Optional[str] = None,
        status_code: Optional[int] = None,
        headers: Optional[Dict[str, str]] = None,
        **extra: Any,
    ) -> None:
        self.detail = detail or self.__class__.detail
        self.status_code = status_code or self.__class__.status_code
        self.headers = headers
        self.extra = extra
        super().__init__(self.detail)


# ---------------------------------------------------------------------------
# 400 Bad Request
# ---------------------------------------------------------------------------

class BadRequestError(AppException):
    status_code = 400
    detail = "Bad request."


class ValidationError(BadRequestError):
    detail = "Validation failed."


class DuplicateError(BadRequestError):
    detail = "Resource already exists."


class InvalidContentTypeError(BadRequestError):
    detail = "Invalid content type."


class FileTooLargeError(BadRequestError):
    status_code = 413
    detail = "Uploaded file exceeds the maximum allowed size."


class UnsupportedMediaTypeError(BadRequestError):
    status_code = 415
    detail = "Unsupported media type."


class PasswordTooWeakError(BadRequestError):
    detail = "Password does not meet strength requirements."


class LimitExceededError(BadRequestError):
    detail = "Resource limit exceeded."


# ---------------------------------------------------------------------------
# 401 Unauthorized
# ---------------------------------------------------------------------------

class AuthenticationError(AppException):
    status_code = 401
    detail = "Authentication required."
    headers = {"WWW-Authenticate": "Bearer"}


class InvalidTokenError(AuthenticationError):
    detail = "Invalid or malformed token."


class ExpiredTokenError(AuthenticationError):
    detail = "Token has expired."


class InvalidCredentialsError(AuthenticationError):
    detail = "Invalid email or password."


class AccountLockedError(AuthenticationError):
    status_code = 423
    detail = "Account temporarily locked due to too many failed login attempts."


# ---------------------------------------------------------------------------
# 403 Forbidden
# ---------------------------------------------------------------------------

class ForbiddenError(AppException):
    status_code = 403
    detail = "You do not have permission to perform this action."


class CreatorRequiredError(ForbiddenError):
    detail = "You must be a creator to perform this action."


class OwnershipError(ForbiddenError):
    detail = "You do not own this resource."


# ---------------------------------------------------------------------------
# 404 Not Found
# ---------------------------------------------------------------------------

class NotFoundError(AppException):
    status_code = 404
    detail = "Resource not found."


class UserNotFoundError(NotFoundError):
    detail = "User not found."


class SeriesNotFoundError(NotFoundError):
    detail = "Series not found."


class EpisodeNotFoundError(NotFoundError):
    detail = "Episode not found."


class CommentNotFoundError(NotFoundError):
    detail = "Comment not found."


# ---------------------------------------------------------------------------
# 409 Conflict
# ---------------------------------------------------------------------------

class ConflictError(AppException):
    status_code = 409
    detail = "Resource conflict."


# ---------------------------------------------------------------------------
# 429 Too Many Requests
# ---------------------------------------------------------------------------

class RateLimitError(AppException):
    status_code = 429
    detail = "Too many requests. Please try again later."


# ---------------------------------------------------------------------------
# 500 Internal Server Error
# ---------------------------------------------------------------------------

class DatabaseError(AppException):
    status_code = 500
    detail = "A database error occurred."


class ExternalServiceError(AppException):
    status_code = 502
    detail = "An external service is unavailable."
