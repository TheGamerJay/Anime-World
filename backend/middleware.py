"""
ASGI middleware for the Anime World API.

Provides:
- Request/response structured logging with correlation IDs
- Global exception handling (converts AppException → JSON HTTP responses)
- Sentry error tracking integration (when DSN is configured)
- Basic request timing metrics
"""

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from backend.exceptions import AppException
from backend.logger import request_id_var

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log every inbound request and its response with timing information.

    A UUID correlation ID is injected into the logging context so that
    all log lines emitted during a single request share the same ID.
    """

    def __init__(self, app: ASGIApp, exclude_paths: tuple[str, ...] = ()) -> None:
        super().__init__(app)
        self.exclude_paths = exclude_paths

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip health-check noise in logs
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        request_id = str(uuid.uuid4())
        token = request_id_var.set(request_id)

        start = time.perf_counter()
        response: Response | None = None
        try:
            logger.info(
                "Request started",
                extra={
                    "http_method": request.method,
                    "http_path": request.url.path,
                    "client_ip": _get_client_ip(request),
                    "user_agent": request.headers.get("user-agent", ""),
                },
            )
            response = await call_next(request)
            return response
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            status_code = response.status_code if response else 500
            log_fn = logger.warning if status_code >= 400 else logger.info
            log_fn(
                "Request completed",
                extra={
                    "http_method": request.method,
                    "http_path": request.url.path,
                    "http_status": status_code,
                    "duration_ms": duration_ms,
                },
            )
            # Expose correlation ID in response headers
            if response is not None:
                response.headers["X-Request-ID"] = request_id
            request_id_var.reset(token)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Convert unhandled exceptions into structured JSON error responses.

    AppException subclasses are mapped to their declared HTTP status codes.
    All other exceptions produce a 500 response and are logged with full
    tracebacks (and forwarded to Sentry when configured).
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except AppException as exc:
            logger.warning(
                "Application error: %s",
                exc.detail,
                extra={"status_code": exc.status_code, "path": request.url.path},
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=exc.headers,
            )
        except Exception as exc:
            logger.exception(
                "Unhandled exception on %s %s",
                request.method,
                request.url.path,
            )
            _report_to_sentry(exc, request)
            return JSONResponse(
                status_code=500,
                content={"detail": "An internal server error occurred."},
            )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_client_ip(request: Request) -> str:
    """Extract the real client IP, respecting common proxy headers."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    if request.client:
        return request.client.host
    return "unknown"


def _report_to_sentry(exc: Exception, request: Request) -> None:
    """Forward exception to Sentry if the SDK is initialised."""
    try:
        import sentry_sdk  # type: ignore[import]
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("path", str(request.url.path))
            scope.set_tag("method", request.method)
            sentry_sdk.capture_exception(exc)
    except ImportError:
        pass  # Sentry not installed — silently skip
    except Exception:
        logger.debug("Failed to report exception to Sentry.", exc_info=True)
