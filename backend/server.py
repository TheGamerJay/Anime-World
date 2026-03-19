"""
Anime World API — application entry point.

This module wires together all routers, middleware, and lifecycle hooks.
The legacy monolithic routes are preserved under /api (v0) for backward
compatibility while the new modular routes are mounted under /api/v1.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Request, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.database import db_manager, get_db
from backend.logger import setup_logging
from backend.middleware import ErrorHandlingMiddleware, RequestLoggingMiddleware

# Import v1 routers
from backend.auth import router as auth_router
from backend.series import router as series_router
from backend.episodes import router as episodes_router
from backend.comments import router as comments_router
from backend.notifications import router as notifications_router
from backend.profiles import router as profiles_router
from backend.watchlist import router as watchlist_router

# ---------------------------------------------------------------------------
# Bootstrap logging before anything else
# ---------------------------------------------------------------------------
settings = get_settings()
setup_logging(level=settings.LOG_LEVEL, json_logs=settings.LOG_JSON)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Sentry (optional)
# ---------------------------------------------------------------------------
if settings.SENTRY_DSN:
    try:
        import sentry_sdk  # type: ignore[import]
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            environment=settings.ENVIRONMENT,
        )
        logger.info("Sentry initialised.")
    except ImportError:
        logger.warning("sentry-sdk not installed; error tracking disabled.")

# ---------------------------------------------------------------------------
# Application lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup, disconnect on shutdown."""
    await db_manager.connect()
    logger.info(
        "%s v%s starting in %s mode on port %d",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
        settings.PORT,
    )
    yield
    await db_manager.disconnect()
    logger.info("Application shutdown complete.")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Anime streaming platform API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware (order matters — outermost first)
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(
    RequestLoggingMiddleware,
    exclude_paths=("/api/v1/health", "/api/health"),
)

# ---------------------------------------------------------------------------
# v1 API routers
# ---------------------------------------------------------------------------

v1 = APIRouter(prefix="/api/v1")
v1.include_router(auth_router)
v1.include_router(series_router)
v1.include_router(episodes_router)
v1.include_router(comments_router)
v1.include_router(notifications_router)
v1.include_router(profiles_router)
v1.include_router(watchlist_router)

app.include_router(v1)

# ---------------------------------------------------------------------------
# Health check (v1)
# ---------------------------------------------------------------------------

@v1.get("/health", tags=["Health"])
async def health_check_v1():
    """
    Detailed health check including database connectivity.

    Returns 200 when healthy, 503 when the database is unreachable.
    """
    db_ok = await db_manager.ping()
    status = "healthy" if db_ok else "degraded"
    payload = {
        "status": status,
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected" if db_ok else "unreachable",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return JSONResponse(content=payload, status_code=200 if db_ok else 503)


# ---------------------------------------------------------------------------
# Seed endpoint (v1)
# ---------------------------------------------------------------------------

@v1.post("/seed", tags=["Admin"])
async def seed_data_v1(db=Depends(get_db)):
    """Populate the database with demo data (no-op if data already exists)."""
    return await _seed(db)


# ---------------------------------------------------------------------------
# Legacy /api router (v0 — backward compatibility)
# ---------------------------------------------------------------------------

ROOT_DIR = Path(__file__).parent

# Re-export legacy constants used by the old monolithic routes
JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = settings.JWT_EXPIRATION_HOURS

legacy_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ---- Legacy models ----

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class SeriesCreate(BaseModel):
    title: str
    description: str
    genre: str
    custom_genre: Optional[str] = None
    content_type: str = "series"
    tags: List[str] = []
    thumbnail_base64: Optional[str] = None
    cover_base64: Optional[str] = None

class EpisodeCreate(BaseModel):
    series_id: str
    title: str
    description: Optional[str] = ""
    episode_number: int
    video_url: Optional[str] = ""
    content_text: Optional[str] = ""
    thumbnail_base64: Optional[str] = None
    is_premium: bool = False
    arc_name: Optional[str] = None

class ReportCreate(BaseModel):
    content_type: str
    content_id: str
    reason: str
    details: Optional[str] = ""

class CommentCreate(BaseModel):
    content_type: str
    content_id: str
    text: str
    parent_id: Optional[str] = None

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_url: Optional[str] = None
    avatar_type: Optional[str] = None

class ReadingProgressUpdate(BaseModel):
    series_id: str
    episode_id: str
    progress: float
    completed: bool = False

# ---- Legacy auth helpers ----

def _create_token(user_id: str) -> str:
    from datetime import timedelta
    return jwt.encode(
        {"user_id": user_id, "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)},
        JWT_SECRET, algorithm=JWT_ALGORITHM,
    )

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

async def _get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        db = db_manager.db
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def _optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        db = db_manager.db
        return await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    except Exception:
        return None

# ---- Legacy auth routes ----

@legacy_router.post("/auth/register")
async def legacy_register(data: UserRegister):
    db = db_manager.db
    if await db.users.find_one({"email": data.email}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db.users.find_one({"username": data.username}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Username already taken")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id, "username": data.username, "email": data.email,
        "password_hash": _hash_password(data.password), "avatar_color": "#00F0FF",
        "bio": "", "is_creator": False, "is_premium": False,
        "follower_count": 0, "following_count": 0,
        "total_earnings": 0.0, "balance": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = _create_token(user_id)
    safe = {k: v for k, v in user_doc.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": safe}

@legacy_router.post("/auth/login")
async def legacy_login(data: UserLogin):
    db = db_manager.db
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not _verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _create_token(user["id"])
    safe = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": safe}

@legacy_router.get("/auth/me")
async def legacy_get_me(user=Depends(_get_current_user)):
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}

@legacy_router.put("/auth/become-creator")
async def legacy_become_creator(user=Depends(_get_current_user)):
    db = db_manager.db
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_creator": True}})
    return {"message": "You are now a creator!"}

@legacy_router.post("/auth/forgot-password")
async def legacy_forgot_password(email: str):
    db = db_manager.db
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user:
        reset_token = str(uuid.uuid4())
        await db.password_resets.update_one(
            {"email": email},
            {"$set": {"email": email, "token": reset_token, "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        return {"message": "If an account exists with this email, you will receive a password reset link", "reset_token": reset_token}
    return {"message": "If an account exists with this email, you will receive a password reset link"}

@legacy_router.post("/auth/reset-password")
async def legacy_reset_password(token: str, new_password: str):
    from datetime import timedelta
    db = db_manager.db
    reset_doc = await db.password_resets.find_one({"token": token}, {"_id": 0})
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    created = datetime.fromisoformat(reset_doc["created_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) - created > timedelta(hours=24):
        await db.password_resets.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Reset token expired")
    await db.users.update_one({"email": reset_doc["email"]}, {"$set": {"password_hash": _hash_password(new_password)}})
    await db.password_resets.delete_one({"token": token})
    return {"message": "Password reset successfully"}

# ---- Legacy series routes ----

@legacy_router.post("/series")
async def legacy_create_series(data: SeriesCreate, user=Depends(_get_current_user)):
    db = db_manager.db
    if not user.get("is_creator"):
        raise HTTPException(status_code=403, detail="You must be a creator to upload")
    final_genre = data.custom_genre if data.genre == "Custom" and data.custom_genre else data.genre
    valid_content_types = ["series", "novel", "movie"]
    content_type = data.content_type if data.content_type in valid_content_types else "series"
    series_id = str(uuid.uuid4())
    series_doc = {
        "id": series_id, "creator_id": user["id"], "creator_name": user["username"],
        "creator_avatar_color": user.get("avatar_color", "#00F0FF"),
        "title": data.title, "description": data.description,
        "genre": final_genre, "content_type": content_type, "tags": data.tags,
        "thumbnail_base64": data.thumbnail_base64, "cover_base64": data.cover_base64,
        "episode_count": 0, "view_count": 0, "like_count": 0,
        "subscriber_count": 0, "is_featured": False,
        "status": "ongoing", "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.series.insert_one(series_doc)
    series_doc.pop("_id", None)
    return series_doc

@legacy_router.get("/series")
async def legacy_list_series(genre: Optional[str] = None, sort: str = "latest", page: int = 1, limit: int = 20):
    db = db_manager.db
    query: Dict[str, Any] = {}
    if genre and genre != "all":
        query["genre"] = genre
    sort_field = {"latest": ("created_at", -1), "popular": ("view_count", -1), "liked": ("like_count", -1)}.get(sort, ("created_at", -1))
    skip = (page - 1) * limit
    items = await db.series.find(query, {"_id": 0}).sort(*sort_field).skip(skip).limit(limit).to_list(limit)
    total = await db.series.count_documents(query)
    return {"data": items, "total": total, "page": page}

@legacy_router.get("/series/search")
async def legacy_search_series(q: str = Query(..., min_length=1)):
    db = db_manager.db
    items = await db.series.find({"title": {"$regex": q, "$options": "i"}}, {"_id": 0}).limit(20).to_list(20)
    return {"data": items}

@legacy_router.get("/series/{series_id}")
async def legacy_get_series(series_id: str):
    db = db_manager.db
    series = await db.series.find_one({"id": series_id}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    await db.series.update_one({"id": series_id}, {"$inc": {"view_count": 1}})
    return series

@legacy_router.get("/series/{series_id}/episodes")
async def legacy_get_episodes(series_id: str):
    db = db_manager.db
    episodes = await db.series_episodes.find({"series_id": series_id}, {"_id": 0}).sort("episode_number", 1).to_list(100)
    return {"data": episodes}

@legacy_router.delete("/series/{series_id}")
async def legacy_delete_series(series_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    series = await db.series.find_one({"id": series_id, "creator_id": user["id"]}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found or not yours")
    await db.series.delete_one({"id": series_id})
    await db.series_episodes.delete_many({"series_id": series_id})
    return {"message": "Series deleted"}

# ---- Legacy episode routes ----

@legacy_router.post("/episodes")
async def legacy_create_episode(data: EpisodeCreate, user=Depends(_get_current_user)):
    db = db_manager.db
    series = await db.series.find_one({"id": data.series_id, "creator_id": user["id"]}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found or not yours")
    ep_id = str(uuid.uuid4())
    ep_doc = {
        "id": ep_id, "series_id": data.series_id, "creator_id": user["id"],
        "title": data.title, "description": data.description,
        "episode_number": data.episode_number,
        "video_url": data.video_url or "",
        "content_text": data.content_text or "",
        "arc_name": data.arc_name,
        "thumbnail_base64": data.thumbnail_base64 or series.get("thumbnail_base64"),
        "is_premium": data.is_premium, "view_count": 0, "like_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.series_episodes.insert_one(ep_doc)
    await db.series.update_one({"id": data.series_id}, {"$inc": {"episode_count": 1}})
    ep_doc.pop("_id", None)
    return ep_doc

@legacy_router.get("/episodes/{episode_id}")
async def legacy_get_episode(episode_id: str):
    db = db_manager.db
    ep = await db.series_episodes.find_one({"id": episode_id}, {"_id": 0})
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    await db.series_episodes.update_one({"id": episode_id}, {"$inc": {"view_count": 1}})
    await db.series.update_one({"id": ep["series_id"]}, {"$inc": {"view_count": 1}})
    return ep

@legacy_router.delete("/episodes/{episode_id}")
async def legacy_delete_episode(episode_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    ep = await db.series_episodes.find_one({"id": episode_id, "creator_id": user["id"]}, {"_id": 0})
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found or not yours")
    await db.series_episodes.delete_one({"id": episode_id})
    await db.series.update_one({"id": ep["series_id"]}, {"$inc": {"episode_count": -1}})
    return {"message": "Episode deleted"}

# ---- Legacy comments ----

async def _legacy_create_notification(user_id: str, notif_type: str, message: str, related_id: str = None):
    db = db_manager.db
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "type": notif_type,
        "message": message, "related_id": related_id, "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

@legacy_router.post("/comments")
async def legacy_create_comment(data: CommentCreate, user=Depends(_get_current_user)):
    db = db_manager.db
    if data.content_type == "series":
        content = await db.series.find_one({"id": data.content_id}, {"_id": 0})
    elif data.content_type == "episode":
        content = await db.series_episodes.find_one({"id": data.content_id}, {"_id": 0})
    else:
        raise HTTPException(status_code=400, detail="Invalid content type")
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    if len(data.text.strip()) < 1:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "id": comment_id, "content_type": data.content_type, "content_id": data.content_id,
        "user_id": user["id"], "username": user["username"],
        "avatar_color": user.get("avatar_color", "#00F0FF"),
        "text": data.text.strip(), "parent_id": data.parent_id,
        "like_count": 0, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(comment_doc)
    owner_id = content.get("creator_id")
    if owner_id and owner_id != user["id"]:
        await _legacy_create_notification(owner_id, "comment", f"{user['username']} commented on your content", data.content_id)
    comment_doc.pop("_id", None)
    return comment_doc

@legacy_router.get("/comments/{content_type}/{content_id}")
async def legacy_get_comments(content_type: str, content_id: str, page: int = 1):
    db = db_manager.db
    skip = (page - 1) * 20
    comments = await db.comments.find(
        {"content_type": content_type, "content_id": content_id, "parent_id": None}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(20).to_list(20)
    for comment in comments:
        replies = await db.comments.find({"parent_id": comment["id"]}, {"_id": 0}).sort("created_at", 1).limit(5).to_list(5)
        comment["replies"] = replies
        comment["reply_count"] = await db.comments.count_documents({"parent_id": comment["id"]})
    total = await db.comments.count_documents({"content_type": content_type, "content_id": content_id, "parent_id": None})
    return {"comments": comments, "total": total, "page": page}

@legacy_router.delete("/comments/{comment_id}")
async def legacy_delete_comment(comment_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your comment")
    await db.comments.delete_one({"id": comment_id})
    await db.comments.delete_many({"parent_id": comment_id})
    return {"message": "Comment deleted"}

@legacy_router.post("/comments/{comment_id}/like")
async def legacy_like_comment(comment_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    existing = await db.comment_likes.find_one({"comment_id": comment_id, "user_id": user["id"]})
    if existing:
        await db.comment_likes.delete_one({"comment_id": comment_id, "user_id": user["id"]})
        await db.comments.update_one({"id": comment_id}, {"$inc": {"like_count": -1}})
        return {"liked": False}
    await db.comment_likes.insert_one({"comment_id": comment_id, "user_id": user["id"], "created_at": datetime.now(timezone.utc).isoformat()})
    await db.comments.update_one({"id": comment_id}, {"$inc": {"like_count": 1}})
    return {"liked": True}

# ---- Legacy notifications ----

@legacy_router.get("/notifications")
async def legacy_get_notifications(user=Depends(_get_current_user)):
    db = db_manager.db
    notifications = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    unread_count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"notifications": notifications, "unread_count": unread_count}

@legacy_router.put("/notifications/read")
async def legacy_mark_notifications_read(user=Depends(_get_current_user)):
    db = db_manager.db
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"message": "All notifications marked as read"}

@legacy_router.put("/notifications/{notif_id}/read")
async def legacy_mark_notification_read(notif_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    await db.notifications.update_one({"id": notif_id, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}

@legacy_router.delete("/notifications/{notif_id}")
async def legacy_delete_notification(notif_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    await db.notifications.delete_one({"id": notif_id, "user_id": user["id"]})
    return {"message": "Notification deleted"}

# ---- Legacy progress ----

@legacy_router.post("/progress")
async def legacy_update_progress(data: ReadingProgressUpdate, user=Depends(_get_current_user)):
    db = db_manager.db
    await db.reading_progress.update_one(
        {"user_id": user["id"], "series_id": data.series_id, "episode_id": data.episode_id},
        {"$set": {"user_id": user["id"], "series_id": data.series_id, "episode_id": data.episode_id,
                  "progress": data.progress, "completed": data.completed,
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"message": "Progress saved"}

@legacy_router.get("/progress/{series_id}")
async def legacy_get_series_progress(series_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    progress_list = await db.reading_progress.find({"user_id": user["id"], "series_id": series_id}, {"_id": 0}).to_list(100)
    return {"progress": progress_list}

@legacy_router.get("/continue-watching")
async def legacy_get_continue_watching(user=Depends(_get_current_user)):
    db = db_manager.db
    progress_list = await db.reading_progress.find(
        {"user_id": user["id"], "completed": False, "progress": {"$gt": 0}}, {"_id": 0}
    ).sort("updated_at", -1).limit(10).to_list(10)
    result = []
    for p in progress_list:
        series = await db.series.find_one({"id": p["series_id"]}, {"_id": 0})
        episode = await db.series_episodes.find_one({"id": p["episode_id"]}, {"_id": 0})
        if series and episode:
            result.append({"series": series, "episode": episode, "progress": p["progress"], "updated_at": p["updated_at"]})
    return {"items": result}

# ---- Legacy profile ----

@legacy_router.put("/profile")
async def legacy_update_profile_full(data: ProfileUpdate, user=Depends(_get_current_user)):
    db = db_manager.db
    update_data: Dict[str, Any] = {}
    if data.bio is not None:
        update_data["bio"] = data.bio[:500]
    if data.avatar_color is not None:
        update_data["avatar_color"] = data.avatar_color
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

@legacy_router.get("/creators/{user_id}")
async def legacy_get_creator_profile(user_id: str):
    db = db_manager.db
    creator = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    series_list = await db.series.find({"creator_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"creator": creator, "series": series_list}

@legacy_router.put("/profile/update")
async def legacy_update_profile(bio: str = "", avatar_color: str = "#00F0FF", user=Depends(_get_current_user)):
    db = db_manager.db
    await db.users.update_one({"id": user["id"]}, {"$set": {"bio": bio, "avatar_color": avatar_color}})
    return {"message": "Profile updated"}

# ---- Legacy avatar ----

UPLOAD_DIR = ROOT_DIR / "uploads" / "avatars"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_AVATAR_SIZE = 20 * 1024 * 1024
ALLOWED_AVATAR_TYPES = {
    "image/jpeg": ("image", ".jpg"), "image/png": ("image", ".png"),
    "image/webp": ("image", ".webp"), "image/gif": ("gif", ".gif"),
    "video/mp4": ("video", ".mp4"), "video/quicktime": ("video", ".mov"),
    "video/webm": ("video", ".webm"),
}

@legacy_router.post("/profile/avatar")
async def legacy_upload_avatar(file: UploadFile = File(...), user=Depends(_get_current_user)):
    db = db_manager.db
    content_type = file.content_type or ""
    if content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")
    avatar_type, extension = ALLOWED_AVATAR_TYPES[content_type]
    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 20MB")
    file_id = str(uuid.uuid4())
    filename = f"{user['id']}_{file_id}{extension}"
    file_path = UPLOAD_DIR / filename
    old_avatar = user.get("avatar_url")
    if old_avatar and old_avatar.startswith("/api/uploads/avatars/"):
        old_path = UPLOAD_DIR / old_avatar.split("/")[-1]
        if old_path.exists():
            old_path.unlink()
    with open(file_path, "wb") as f:
        f.write(contents)
    avatar_url = f"/api/uploads/avatars/{filename}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar_url": avatar_url, "avatar_type": avatar_type}})
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return {"message": "Avatar uploaded successfully", "avatar_url": avatar_url, "avatar_type": avatar_type, "user": updated_user}

@legacy_router.delete("/profile/avatar")
async def legacy_delete_avatar(user=Depends(_get_current_user)):
    db = db_manager.db
    old_avatar = user.get("avatar_url")
    if old_avatar and old_avatar.startswith("/api/uploads/avatars/"):
        old_path = UPLOAD_DIR / old_avatar.split("/")[-1]
        if old_path.exists():
            old_path.unlink()
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar_url": None, "avatar_type": None}})
    return {"message": "Avatar removed"}

@legacy_router.get("/uploads/avatars/{filename}")
async def legacy_get_avatar_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    ext = file_path.suffix.lower()
    content_types = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
                     ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4",
                     ".mov": "video/quicktime", ".webm": "video/webm"}
    return FileResponse(file_path, media_type=content_types.get(ext, "application/octet-stream"))

# ---- Legacy follow ----

@legacy_router.post("/follow/{creator_id}")
async def legacy_follow_creator(creator_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    if creator_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    existing = await db.follows.find_one({"follower_id": user["id"], "following_id": creator_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already following")
    await db.follows.insert_one({"follower_id": user["id"], "following_id": creator_id, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.users.update_one({"id": creator_id}, {"$inc": {"follower_count": 1}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"following_count": 1}})
    await _legacy_create_notification(creator_id, "follow", f"{user['username']} started following you", user["id"])
    return {"message": "Followed"}

@legacy_router.delete("/follow/{creator_id}")
async def legacy_unfollow_creator(creator_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    result = await db.follows.delete_one({"follower_id": user["id"], "following_id": creator_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not following")
    await db.users.update_one({"id": creator_id}, {"$inc": {"follower_count": -1}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"following_count": -1}})
    return {"message": "Unfollowed"}

@legacy_router.get("/follow/check/{creator_id}")
async def legacy_check_follow(creator_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    existing = await db.follows.find_one({"follower_id": user["id"], "following_id": creator_id}, {"_id": 0})
    return {"is_following": existing is not None}

# ---- Legacy watchlist ----

@legacy_router.get("/watchlist")
async def legacy_get_watchlist(user=Depends(_get_current_user)):
    db = db_manager.db
    items = await db.watchlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return {"items": items}

@legacy_router.post("/watchlist/{series_id}")
async def legacy_add_to_watchlist(series_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    existing = await db.watchlist.find_one({"user_id": user["id"], "series_id": series_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")
    series = await db.series.find_one({"id": series_id}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    doc = {"user_id": user["id"], "series_id": series_id, "title": series["title"],
           "thumbnail_base64": series.get("thumbnail_base64"), "genre": series.get("genre"),
           "added_at": datetime.now(timezone.utc).isoformat()}
    await db.watchlist.insert_one(doc)
    return {"message": "Added to watchlist"}

@legacy_router.delete("/watchlist/{series_id}")
async def legacy_remove_from_watchlist(series_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    result = await db.watchlist.delete_one({"user_id": user["id"], "series_id": series_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in watchlist")
    return {"message": "Removed from watchlist"}

# ---- Legacy likes ----

@legacy_router.post("/like/series/{series_id}")
async def legacy_like_series(series_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    existing = await db.likes.find_one({"user_id": user["id"], "series_id": series_id}, {"_id": 0})
    if existing:
        await db.likes.delete_one({"user_id": user["id"], "series_id": series_id})
        await db.series.update_one({"id": series_id}, {"$inc": {"like_count": -1}})
        return {"liked": False}
    await db.likes.insert_one({"user_id": user["id"], "series_id": series_id, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.series.update_one({"id": series_id}, {"$inc": {"like_count": 1}})
    return {"liked": True}

@legacy_router.get("/like/check/{series_id}")
async def legacy_check_like(series_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    existing = await db.likes.find_one({"user_id": user["id"], "series_id": series_id}, {"_id": 0})
    return {"liked": existing is not None}

# ---- Legacy genres / feed ----

GENRES_LIST = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance",
               "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Mystery", "Mecha", "Isekai", "Thriller"]

@legacy_router.get("/genres")
async def legacy_get_genres():
    return {"genres": GENRES_LIST}

@legacy_router.get("/feed/featured")
async def legacy_get_featured():
    db = db_manager.db
    items = await db.series.find({}, {"_id": 0}).sort("like_count", -1).limit(5).to_list(5)
    return {"data": items}

@legacy_router.get("/feed/trending")
async def legacy_get_trending():
    db = db_manager.db
    items = await db.series.find({}, {"_id": 0}).sort("view_count", -1).limit(20).to_list(20)
    return {"data": items}

@legacy_router.get("/feed/latest")
async def legacy_get_latest():
    db = db_manager.db
    items = await db.series.find({}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    return {"data": items}

@legacy_router.get("/feed/top-creators")
async def legacy_get_top_creators():
    db = db_manager.db
    creators = await db.users.find({"is_creator": True}, {"_id": 0, "password_hash": 0}).sort("follower_count", -1).limit(10).to_list(10)
    return {"data": creators}

@legacy_router.get("/my/series")
async def legacy_my_series(user=Depends(_get_current_user)):
    db = db_manager.db
    items = await db.series.find({"creator_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"data": items}

# ---- Legacy reports ----

@legacy_router.post("/reports")
async def legacy_create_report(data: ReportCreate, user=Depends(_get_current_user)):
    db = db_manager.db
    if data.content_type == "series":
        content = await db.series.find_one({"id": data.content_id}, {"_id": 0})
    elif data.content_type == "episode":
        content = await db.series_episodes.find_one({"id": data.content_id}, {"_id": 0})
    elif data.content_type == "user":
        content = await db.users.find_one({"id": data.content_id}, {"_id": 0, "password_hash": 0})
    else:
        raise HTTPException(status_code=400, detail="Invalid content type")
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    report_id = str(uuid.uuid4())
    report_doc = {
        "id": report_id, "reporter_id": user["id"], "reporter_username": user["username"],
        "content_type": data.content_type, "content_id": data.content_id,
        "content_title": content.get("title") or content.get("username", "Unknown"),
        "content_creator_id": content.get("creator_id") or content.get("id"),
        "reason": data.reason, "details": data.details, "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report_doc)
    report_doc.pop("_id", None)
    return {"message": "Report submitted successfully", "report_id": report_id}

@legacy_router.get("/reports")
async def legacy_get_reports(status: Optional[str] = None, user=Depends(_get_current_user)):
    db = db_manager.db
    query: Dict[str, Any] = {"content_creator_id": user["id"]}
    if status:
        query["status"] = status
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"reports": reports}

# ---- Legacy profiles ----

@legacy_router.get("/profiles")
async def legacy_get_profiles(user=Depends(_get_current_user)):
    db = db_manager.db
    profiles = await db.profiles.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    if not profiles:
        default = {
            "id": str(uuid.uuid4()), "user_id": user["id"], "name": user["username"],
            "avatar_color": user.get("avatar_color", "#00F0FF"), "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.profiles.insert_one(default)
        default.pop("_id", None)
        profiles = [default]
    return {"profiles": profiles}

@legacy_router.post("/profiles")
async def legacy_create_profile(name: str, avatar_color: str = "#00F0FF", user=Depends(_get_current_user)):
    db = db_manager.db
    count = await db.profiles.count_documents({"user_id": user["id"]})
    if count >= 5:
        raise HTTPException(status_code=400, detail="Maximum of 5 profiles allowed")
    doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "name": name,
        "avatar_color": avatar_color, "is_active": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.profiles.insert_one(doc)
    doc.pop("_id", None)
    return doc

@legacy_router.put("/profiles/{profile_id}/switch")
async def legacy_switch_profile(profile_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    profile = await db.profiles.find_one({"id": profile_id, "user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.profiles.update_many({"user_id": user["id"]}, {"$set": {"is_active": False}})
    await db.profiles.update_one({"id": profile_id}, {"$set": {"is_active": True}})
    profile["is_active"] = True
    return {"message": "Profile switched", "profile": profile}

@legacy_router.delete("/profiles/{profile_id}")
async def legacy_delete_profile(profile_id: str, user=Depends(_get_current_user)):
    db = db_manager.db
    profile = await db.profiles.find_one({"id": profile_id, "user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    count = await db.profiles.count_documents({"user_id": user["id"]})
    if count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete your only profile")
    await db.profiles.delete_one({"id": profile_id})
    return {"message": "Profile deleted"}

# ---- Legacy history ----

@legacy_router.get("/history")
async def legacy_get_history(user=Depends(_get_current_user)):
    db = db_manager.db
    items = await db.watch_history.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).limit(50).to_list(50)
    return {"items": items}

@legacy_router.post("/history")
async def legacy_update_history(
    anime_id: int, episode_number: int, title: str, anime_title: str,
    image_url: Optional[str] = None, progress: float = 0.0,
    user=Depends(_get_current_user)
):
    db = db_manager.db
    await db.watch_history.update_one(
        {"user_id": user["id"], "anime_id": anime_id, "episode_number": episode_number},
        {"$set": {"user_id": user["id"], "anime_id": anime_id, "episode_number": episode_number,
                  "title": title, "anime_title": anime_title, "image_url": image_url,
                  "progress": progress, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"message": "History updated"}

# ---- Legacy watchlist check ----

@legacy_router.get("/watchlist/check/{anime_id}")
async def legacy_check_watchlist(anime_id: int, user=Depends(_get_current_user)):
    db = db_manager.db
    existing = await db.watchlist.find_one({"user_id": user["id"], "series_id": str(anime_id)}, {"_id": 0})
    return {"in_watchlist": existing is not None}

# ---- Legacy health ----

@legacy_router.get("/health")
async def legacy_health_check():
    return {"status": "healthy", "service": "anime-world-api"}

# ---- Legacy seed ----

@legacy_router.post("/seed")
async def legacy_seed_data():
    db = db_manager.db
    return await _seed(db)

# ---------------------------------------------------------------------------
# Register legacy router
# ---------------------------------------------------------------------------

app.include_router(legacy_router)

# ---------------------------------------------------------------------------
# Seed helper (shared between v0 and v1)
# ---------------------------------------------------------------------------

async def _seed(db) -> dict:
    existing = await db.series.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}

    creators = [
        {"id": str(uuid.uuid4()), "username": "SakuraStudio", "email": "sakura@demo.com",
         "password_hash": _hash_password("demo123"), "avatar_color": "#FF0099",
         "bio": "Independent anime studio creating original stories", "is_creator": True,
         "is_premium": False, "follower_count": 1240, "following_count": 5,
         "total_earnings": 0.0, "balance": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "username": "NeonDreams", "email": "neon@demo.com",
         "password_hash": _hash_password("demo123"), "avatar_color": "#00F0FF",
         "bio": "Cyberpunk anime creator | New episodes every week", "is_creator": True,
         "is_premium": False, "follower_count": 890, "following_count": 12,
         "total_earnings": 0.0, "balance": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "username": "MoonlitArts", "email": "moonlit@demo.com",
         "password_hash": _hash_password("demo123"), "avatar_color": "#7000FF",
         "bio": "Fantasy & romance anime | Dreaming in color", "is_creator": True,
         "is_premium": False, "follower_count": 2100, "following_count": 8,
         "total_earnings": 0.0, "balance": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "username": "ThunderAnime", "email": "thunder@demo.com",
         "password_hash": _hash_password("demo123"), "avatar_color": "#FFD600",
         "bio": "Action-packed original anime | Fight scenes specialist", "is_creator": True,
         "is_premium": False, "follower_count": 3400, "following_count": 3,
         "total_earnings": 0.0, "balance": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    for c in creators:
        await db.users.update_one({"email": c["email"]}, {"$set": c}, upsert=True)

    demo_series = [
        {"id": str(uuid.uuid4()), "creator_id": creators[0]["id"], "creator_name": "SakuraStudio",
         "creator_avatar_color": "#FF0099", "title": "Crimson Petals",
         "description": "A young warrior discovers she holds the power of the ancient sakura spirits.",
         "genre": "Fantasy", "content_type": "series", "tags": ["fantasy", "action", "magic"],
         "thumbnail_base64": None, "cover_base64": None, "episode_count": 6,
         "view_count": 15600, "like_count": 890, "subscriber_count": 340,
         "is_featured": True, "status": "ongoing", "created_at": "2026-01-15T10:00:00+00:00"},
        {"id": str(uuid.uuid4()), "creator_id": creators[1]["id"], "creator_name": "NeonDreams",
         "creator_avatar_color": "#00F0FF", "title": "Circuit Zero",
         "description": "In Neo-Tokyo 2099, a hacker discovers a conspiracy.",
         "genre": "Sci-Fi", "content_type": "series", "tags": ["cyberpunk", "sci-fi", "thriller"],
         "thumbnail_base64": None, "cover_base64": None, "episode_count": 4,
         "view_count": 12300, "like_count": 720, "subscriber_count": 210,
         "is_featured": True, "status": "ongoing", "created_at": "2026-02-01T10:00:00+00:00"},
        {"id": str(uuid.uuid4()), "creator_id": creators[2]["id"], "creator_name": "MoonlitArts",
         "creator_avatar_color": "#7000FF", "title": "Starlight Academy",
         "description": "At a prestigious academy for gifted artists, two rivals discover magic.",
         "genre": "Romance", "content_type": "series", "tags": ["romance", "school", "magic"],
         "thumbnail_base64": None, "cover_base64": None, "episode_count": 8,
         "view_count": 23400, "like_count": 1850, "subscriber_count": 670,
         "is_featured": True, "status": "ongoing", "created_at": "2025-12-20T10:00:00+00:00"},
        {"id": str(uuid.uuid4()), "creator_id": creators[3]["id"], "creator_name": "ThunderAnime",
         "creator_avatar_color": "#FFD600", "title": "Iron Fist Legacy",
         "description": "The last martial arts master must train a new generation of fighters.",
         "genre": "Action", "content_type": "series", "tags": ["action", "martial-arts", "tournament"],
         "thumbnail_base64": None, "cover_base64": None, "episode_count": 12,
         "view_count": 45200, "like_count": 3200, "subscriber_count": 1100,
         "is_featured": True, "status": "ongoing", "created_at": "2025-11-10T10:00:00+00:00"},
    ]
    for s in demo_series:
        await db.series.insert_one(s)

    return {"message": "Seeded successfully", "creators": len(creators), "series": len(demo_series)}


# ---------------------------------------------------------------------------
# Frontend static file serving
# ---------------------------------------------------------------------------

FRONTEND_DIST = ROOT_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIST)), name="static")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return JSONResponse({"detail": "Not found"}, status_code=404)
