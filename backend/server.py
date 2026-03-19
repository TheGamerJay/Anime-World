from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Request, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'anime_world')]

JWT_SECRET = os.environ.get('JWT_SECRET', 'anime-world-creator-secret-2026')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

app = FastAPI(title="Anime World API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Stripe setup


# ============ MODELS ============
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
    custom_genre: Optional[str] = None  # For custom genres
    content_type: str = "series"  # series, novel, movie
    tags: List[str] = []
    thumbnail_base64: Optional[str] = None
    cover_base64: Optional[str] = None

class EpisodeCreate(BaseModel):
    series_id: str
    title: str
    description: Optional[str] = ""
    episode_number: int
    video_url: Optional[str] = ""  # For series/movies
    content_text: Optional[str] = ""  # For novels (chapter content)
    thumbnail_base64: Optional[str] = None
    is_premium: bool = False
    arc_name: Optional[str] = None  # For grouping into arcs

class ReportCreate(BaseModel):
    content_type: str  # series, episode, user
    content_id: str
    reason: str  # copyright, inappropriate, spam, harassment, other
    details: Optional[str] = ""

class CommentCreate(BaseModel):
    content_type: str  # series, episode
    content_id: str
    text: str
    parent_id: Optional[str] = None  # For replies

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_url: Optional[str] = None
    avatar_type: Optional[str] = None  # 'image', 'gif', 'video'

class ReadingProgressUpdate(BaseModel):
    series_id: str
    episode_id: str
    progress: float  # 0-100 percentage
    completed: bool = False

class TipRequest(BaseModel):
    creator_id: str
    origin_url: str

class PremiumRequest(BaseModel):
    origin_url: str

class ChannelSubRequest(BaseModel):
    creator_id: str
    origin_url: str

# Tip amounts (server-defined, not from frontend)
TIP_AMOUNTS = {"small": 2.00, "medium": 5.00, "large": 10.00, "mega": 25.00}
PREMIUM_PRICE = 4.99
CHANNEL_SUB_PRICE = 2.99
PLATFORM_CUT = 0.20  # 20%

# ============ AUTH ============
def create_token(user_id: str) -> str:
    return jwt.encode({"user_id": user_id, "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS), "iat": datetime.now(timezone.utc)}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    except:
        return None

# ============ AUTH ROUTES ============
@api_router.post("/auth/register")
async def register(data: UserRegister):
    if await db.users.find_one({"email": data.email}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db.users.find_one({"username": data.username}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Username already taken")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id, "username": data.username, "email": data.email,
        "password_hash": hash_password(data.password), "avatar_color": "#00F0FF",
        "bio": "", "is_creator": False, "is_premium": False,
        "follower_count": 0, "following_count": 0,
        "total_earnings": 0.0, "balance": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    safe_user = {k: v for k, v in user_doc.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": safe_user}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": safe_user}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}

@api_router.put("/auth/become-creator")
async def become_creator(user=Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_creator": True}})
    return {"message": "You are now a creator!"}

@api_router.post("/auth/forgot-password")
async def forgot_password(email: str):
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"message": "If an account exists with this email, you will receive a password reset link"}
    reset_token = str(uuid.uuid4())
    await db.password_resets.update_one(
        {"email": email},
        {"$set": {"email": email, "token": reset_token, "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "If an account exists with this email, you will receive a password reset link", "reset_token": reset_token}

@api_router.post("/auth/reset-password")
async def reset_password(token: str, new_password: str):
    reset_doc = await db.password_resets.find_one({"token": token}, {"_id": 0})
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    created = datetime.fromisoformat(reset_doc["created_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) - created > timedelta(hours=24):
        await db.password_resets.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Reset token expired")
    await db.users.update_one(
        {"email": reset_doc["email"]},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    await db.password_resets.delete_one({"token": token})
    return {"message": "Password reset successfully"}

# ============ SERIES ROUTES ============
@api_router.post("/series")
async def create_series(data: SeriesCreate, user=Depends(get_current_user)):
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

@api_router.get("/series")
async def list_series(genre: Optional[str] = None, sort: str = "latest", page: int = 1, limit: int = 20):
    query = {}
    if genre and genre != "all":
        query["genre"] = genre
    sort_field = {"latest": ("created_at", -1), "popular": ("view_count", -1), "liked": ("like_count", -1)}.get(sort, ("created_at", -1))
    skip = (page - 1) * limit
    items = await db.series.find(query, {"_id": 0}).sort(*sort_field).skip(skip).limit(limit).to_list(limit)
    total = await db.series.count_documents(query)
    return {"data": items, "total": total, "page": page}

@api_router.get("/series/search")
async def search_series(q: str = Query(..., min_length=1)):
    items = await db.series.find({"title": {"$regex": q, "$options": "i"}}, {"_id": 0}).limit(20).to_list(20)
    return {"data": items}

@api_router.get("/series/{series_id}")
async def get_series(series_id: str):
    series = await db.series.find_one({"id": series_id}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    await db.series.update_one({"id": series_id}, {"$inc": {"view_count": 1}})
    return series

@api_router.get("/series/{series_id}/episodes")
async def get_episodes(series_id: str):
    episodes = await db.series_episodes.find({"series_id": series_id}, {"_id": 0}).sort("episode_number", 1).to_list(100)
    return {"data": episodes}

@api_router.delete("/series/{series_id}")
async def delete_series(series_id: str, user=Depends(get_current_user)):
    series = await db.series.find_one({"id": series_id, "creator_id": user["id"]}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found or not yours")
    await db.series.delete_one({"id": series_id})
    await db.series_episodes.delete_many({"series_id": series_id})
    return {"message": "Series deleted"}

# ============ EPISODE ROUTES ============
@api_router.post("/episodes")
async def create_episode(data: EpisodeCreate, user=Depends(get_current_user)):
    series = await db.series.find_one({"id": data.series_id, "creator_id": user["id"]}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found or not yours")
    
    content_type = series.get("content_type", "series")
    
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

@api_router.get("/episodes/{episode_id}")
async def get_episode(episode_id: str):
    ep = await db.series_episodes.find_one({"id": episode_id}, {"_id": 0})
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    await db.series_episodes.update_one({"id": episode_id}, {"$inc": {"view_count": 1}})
    await db.series.update_one({"id": ep["series_id"]}, {"$inc": {"view_count": 1}})
    return ep

@api_router.delete("/episodes/{episode_id}")
async def delete_episode(episode_id: str, user=Depends(get_current_user)):
    ep = await db.series_episodes.find_one({"id": episode_id, "creator_id": user["id"]}, {"_id": 0})
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found or not yours")
    await db.series_episodes.delete_one({"id": episode_id})
    await db.series.update_one({"id": ep["series_id"]}, {"$inc": {"episode_count": -1}})
    return {"message": "Episode deleted"}

# ============ REPORT SYSTEM ============
@api_router.post("/reports")
async def create_report(data: ReportCreate, user=Depends(get_current_user)):
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
        "id": report_id,
        "reporter_id": user["id"],
        "reporter_username": user["username"],
        "content_type": data.content_type,
        "content_id": data.content_id,
        "content_title": content.get("title") or content.get("username", "Unknown"),
        "content_creator_id": content.get("creator_id") or content.get("id"),
        "reason": data.reason,
        "details": data.details,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report_doc)
    report_doc.pop("_id", None)
    return {"message": "Report submitted successfully", "report_id": report_id}

@api_router.get("/reports")
async def get_reports(status: Optional[str] = None, user=Depends(get_current_user)):
    query = {"content_creator_id": user["id"]}
    if status:
        query["status"] = status
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"reports": reports}

# ============ COMMENTS SYSTEM ============
@api_router.post("/comments")
async def create_comment(data: CommentCreate, user=Depends(get_current_user)):
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
        "id": comment_id,
        "content_type": data.content_type,
        "content_id": data.content_id,
        "user_id": user["id"],
        "username": user["username"],
        "avatar_color": user.get("avatar_color", "#00F0FF"),
        "text": data.text.strip(),
        "parent_id": data.parent_id,
        "like_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(comment_doc)
    
    owner_id = content.get("creator_id")
    
    if owner_id and owner_id != user["id"]:
        await create_notification(owner_id, "comment", f"{user['username']} commented on your content", data.content_id)
    
    comment_doc.pop("_id", None)
    return comment_doc

@api_router.get("/comments/{content_type}/{content_id}")
async def get_comments(content_type: str, content_id: str, page: int = 1):
    skip = (page - 1) * 20
    comments = await db.comments.find(
        {"content_type": content_type, "content_id": content_id, "parent_id": None},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(20).to_list(20)
    
    for comment in comments:
        replies = await db.comments.find(
            {"parent_id": comment["id"]},
            {"_id": 0}
        ).sort("created_at", 1).limit(5).to_list(5)
        comment["replies"] = replies
        comment["reply_count"] = await db.comments.count_documents({"parent_id": comment["id"]})
    
    total = await db.comments.count_documents({"content_type": content_type, "content_id": content_id, "parent_id": None})
    return {"comments": comments, "total": total, "page": page}

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user=Depends(get_current_user)):
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your comment")
    await db.comments.delete_one({"id": comment_id})
    await db.comments.delete_many({"parent_id": comment_id})
    return {"message": "Comment deleted"}

@api_router.post("/comments/{comment_id}/like")
async def like_comment(comment_id: str, user=Depends(get_current_user)):
    existing = await db.comment_likes.find_one({"comment_id": comment_id, "user_id": user["id"]})
    if existing:
        await db.comment_likes.delete_one({"comment_id": comment_id, "user_id": user["id"]})
        await db.comments.update_one({"id": comment_id}, {"$inc": {"like_count": -1}})
        return {"liked": False}
    else:
        await db.comment_likes.insert_one({"comment_id": comment_id, "user_id": user["id"], "created_at": datetime.now(timezone.utc).isoformat()})
        await db.comments.update_one({"id": comment_id}, {"$inc": {"like_count": 1}})
        return {"liked": True}

# ============ NOTIFICATIONS SYSTEM ============
async def create_notification(user_id: str, notif_type: str, message: str, related_id: str = None):
    notif_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "message": message,
        "related_id": related_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)

@api_router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    unread_count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.put("/notifications/read")
async def mark_notifications_read(user=Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"message": "All notifications marked as read"}

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user=Depends(get_current_user)):
    await db.notifications.update_one({"id": notif_id, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str, user=Depends(get_current_user)):
    await db.notifications.delete_one({"id": notif_id, "user_id": user["id"]})
    return {"message": "Notification deleted"}

# ============ READING/WATCH PROGRESS ============
@api_router.post("/progress")
async def update_progress(data: ReadingProgressUpdate, user=Depends(get_current_user)):
    await db.reading_progress.update_one(
        {"user_id": user["id"], "series_id": data.series_id, "episode_id": data.episode_id},
        {"$set": {
            "user_id": user["id"],
            "series_id": data.series_id,
            "episode_id": data.episode_id,
            "progress": data.progress,
            "completed": data.completed,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Progress saved"}

@api_router.get("/progress/{series_id}")
async def get_series_progress(series_id: str, user=Depends(get_current_user)):
    progress_list = await db.reading_progress.find(
        {"user_id": user["id"], "series_id": series_id},
        {"_id": 0}
    ).to_list(100)
    return {"progress": progress_list}

@api_router.get("/continue-watching")
async def get_continue_watching(user=Depends(get_current_user)):
    progress_list = await db.reading_progress.find(
        {"user_id": user["id"], "completed": False, "progress": {"$gt": 0}},
        {"_id": 0}
    ).sort("updated_at", -1).limit(10).to_list(10)
    
    result = []
    for p in progress_list:
        series = await db.series.find_one({"id": p["series_id"]}, {"_id": 0})
        episode = await db.series_episodes.find_one({"id": p["episode_id"]}, {"_id": 0})
        if series and episode:
            result.append({
                "series": series,
                "episode": episode,
                "progress": p["progress"],
                "updated_at": p["updated_at"]
            })
    return {"items": result}

# ============ PROFILE MANAGEMENT ============
@api_router.put("/profile")
async def update_profile_full(data: ProfileUpdate, user=Depends(get_current_user)):
    update_data = {}
    if data.bio is not None:
        update_data["bio"] = data.bio[:500]
    if data.avatar_color is not None:
        update_data["avatar_color"] = data.avatar_color
    
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

# ============ CREATOR PROFILE ============
@api_router.get("/creators/{user_id}")
async def get_creator_profile(user_id: str):
    creator = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    series_list = await db.series.find({"creator_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"creator": creator, "series": series_list}

@api_router.put("/profile/update")
async def update_profile(bio: str = "", avatar_color: str = "#00F0FF", user=Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"bio": bio, "avatar_color": avatar_color}})
    return {"message": "Profile updated"}

# ============ AVATAR UPLOAD ============
UPLOAD_DIR = ROOT_DIR / "uploads" / "avatars"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_AVATAR_SIZE = 20 * 1024 * 1024

ALLOWED_AVATAR_TYPES = {
    "image/jpeg": ("image", ".jpg"),
    "image/png": ("image", ".png"),
    "image/webp": ("image", ".webp"),
    "image/gif": ("gif", ".gif"),
    "video/mp4": ("video", ".mp4"),
    "video/quicktime": ("video", ".mov"),
    "video/webm": ("video", ".webm"),
}

@api_router.post("/profile/avatar")
async def upload_avatar(file: UploadFile = File(...), user=Depends(get_current_user)):
    content_type = file.content_type or ""
    if content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV, WebM"
        )
    
    avatar_type, extension = ALLOWED_AVATAR_TYPES[content_type]
    
    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is 20MB")
    
    file_id = str(uuid.uuid4())
    filename = f"{user['id']}_{file_id}{extension}"
    file_path = UPLOAD_DIR / filename
    
    old_avatar = user.get("avatar_url")
    if old_avatar and old_avatar.startswith("/api/uploads/avatars/"):
        old_filename = old_avatar.split("/")[-1]
        old_path = UPLOAD_DIR / old_filename
        if old_path.exists():
            old_path.unlink()
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    avatar_url = f"/api/uploads/avatars/{filename}"
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"avatar_url": avatar_url, "avatar_type": avatar_type}}
    )
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": avatar_url,
        "avatar_type": avatar_type,
        "user": updated_user
    }

@api_router.delete("/profile/avatar")
async def delete_avatar(user=Depends(get_current_user)):
    old_avatar = user.get("avatar_url")
    if old_avatar and old_avatar.startswith("/api/uploads/avatars/"):
        old_filename = old_avatar.split("/")[-1]
        old_path = UPLOAD_DIR / old_filename
        if old_path.exists():
            old_path.unlink()
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"avatar_url": None, "avatar_type": None}}
    )
    return {"message": "Avatar removed"}

@api_router.get("/uploads/avatars/{filename}")
async def get_avatar_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    ext = file_path.suffix.lower()
    content_types = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".webp": "image/webp",
        ".gif": "image/gif", ".mp4": "video/mp4",
        ".mov": "video/quicktime", ".webm": "video/webm",
    }
    media_type = content_types.get(ext, "application/octet-stream")
    
    return FileResponse(file_path, media_type=media_type)

# ============ FOLLOW SYSTEM ============
@api_router.post("/follow/{creator_id}")
async def follow_creator(creator_id: str, user=Depends(get_current_user)):
    if creator_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    existing = await db.follows.find_one({"follower_id": user["id"], "following_id": creator_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already following")
    await db.follows.insert_one({"follower_id": user["id"], "following_id": creator_id, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.users.update_one({"id": creator_id}, {"$inc": {"follower_count": 1}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"following_count": 1}})
    await create_notification(creator_id, "follow", f"{user['username']} started following you", user["id"])
    return {"message": "Followed"}

@api_router.delete("/follow/{creator_id}")
async def unfollow_creator(creator_id: str, user=Depends(get_current_user)):
    result = await db.follows.delete_one({"follower_id": user["id"], "following_id": creator_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not following")
    await db.users.update_one({"id": creator_id}, {"$inc": {"follower_count": -1}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"following_count": -1}})
    return {"message": "Unfollowed"}

@api_router.get("/follow/check/{creator_id}")
async def check_follow(creator_id: str, user=Depends(get_current_user)):
    existing = await db.follows.find_one({"follower_id": user["id"], "following_id": creator_id}, {"_id": 0})
    return {"is_following": existing is not None}

# ============ WATCHLIST ============
@api_router.get("/watchlist")
async def get_watchlist(user=Depends(get_current_user)):
    items = await db.watchlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return {"items": items}

@api_router.post("/watchlist/{series_id}")
async def add_to_watchlist(series_id: str, user=Depends(get_current_user)):
    existing = await db.watchlist.find_one({"user_id": user["id"], "series_id": series_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")
    series = await db.series.find_one({"id": series_id}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    doc = {"user_id": user["id"], "series_id": series_id, "title": series["title"], "thumbnail_base64": series.get("thumbnail_base64"), "genre": series.get("genre"), "added_at": datetime.now(timezone.utc).isoformat()}
    await db.watchlist.insert_one(doc)
    return {"message": "Added to watchlist"}

@api_router.delete("/watchlist/{series_id}")
async def remove_from_watchlist(series_id: str, user=Depends(get_current_user)):
    result = await db.watchlist.delete_one({"user_id": user["id"], "series_id": series_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in watchlist")
    return {"message": "Removed from watchlist"}

# ============ LIKES ============
@api_router.post("/like/series/{series_id}")
async def like_series(series_id: str, user=Depends(get_current_user)):
    existing = await db.likes.find_one({"user_id": user["id"], "series_id": series_id}, {"_id": 0})
    if existing:
        await db.likes.delete_one({"user_id": user["id"], "series_id": series_id})
        await db.series.update_one({"id": series_id}, {"$inc": {"like_count": -1}})
        return {"liked": False}
    await db.likes.insert_one({"user_id": user["id"], "series_id": series_id, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.series.update_one({"id": series_id}, {"$inc": {"like_count": 1}})
    return {"liked": True}

@api_router.get("/like/check/{series_id}")
async def check_like(series_id: str, user=Depends(get_current_user)):
    existing = await db.likes.find_one({"user_id": user["id"], "series_id": series_id}, {"_id": 0})
    return {"liked": existing is not None}

# ============ PAYMENTS (STRIPE) ============
@api_router.post("/payments/tip")
async def create_tip(tip_size: str, creator_id: str, origin_url: str, user=Depends(get_current_user)):
    if tip_size not in TIP_AMOUNTS:
        raise HTTPException(status_code=400, detail="Invalid tip size")
    amount = TIP_AMOUNTS[tip_size]
    creator = await db.users.find_one({"id": creator_id}, {"_id": 0})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment-cancel"
    metadata = {"type": "tip", "tipper_id": user["id"], "creator_id": creator_id, "tip_size": tip_size}
    req = CheckoutSessionRequest(amount=amount, currency="usd", success_url=success_url, cancel_url=cancel_url, metadata=metadata)
    session = await stripe_checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "user_id": user["id"], "creator_id": creator_id,
        "type": "tip", "amount": amount, "currency": "usd", "metadata": metadata,
        "payment_status": "pending", "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": session.url, "session_id": session.session_id}

@api_router.post("/payments/premium")
async def create_premium_sub(origin_url: str, user=Depends(get_current_user)):
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment-cancel"
    metadata = {"type": "premium", "user_id": user["id"]}
    req = CheckoutSessionRequest(amount=PREMIUM_PRICE, currency="usd", success_url=success_url, cancel_url=cancel_url, metadata=metadata)
    session = await stripe_checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "user_id": user["id"],
        "type": "premium", "amount": PREMIUM_PRICE, "currency": "usd", "metadata": metadata,
        "payment_status": "pending", "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": session.url, "session_id": session.session_id}

@api_router.post("/payments/channel-sub")
async def create_channel_sub(creator_id: str, origin_url: str, user=Depends(get_current_user)):
    creator = await db.users.find_one({"id": creator_id}, {"_id": 0})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment-cancel"
    metadata = {"type": "channel_sub", "subscriber_id": user["id"], "creator_id": creator_id}
    req = CheckoutSessionRequest(amount=CHANNEL_SUB_PRICE, currency="usd", success_url=success_url, cancel_url=cancel_url, metadata=metadata)
    session = await stripe_checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "user_id": user["id"], "creator_id": creator_id,
        "type": "channel_sub", "amount": CHANNEL_SUB_PRICE, "currency": "usd", "metadata": metadata,
        "payment_status": "pending", "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx["payment_status"] in ("paid", "completed"):
        return tx
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    if status.payment_status == "paid" and tx["payment_status"] != "paid":
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": "paid", "status": status.status}})
        if tx["type"] == "tip":
            creator_share = tx["amount"] * (1 - PLATFORM_CUT)
            await db.users.update_one({"id": tx["creator_id"]}, {"$inc": {"total_earnings": creator_share, "balance": creator_share}})
        elif tx["type"] == "premium":
            await db.users.update_one({"id": tx["user_id"]}, {"$set": {"is_premium": True}})
        elif tx["type"] == "channel_sub":
            creator_share = tx["amount"] * (1 - PLATFORM_CUT)
            await db.users.update_one({"id": tx["creator_id"]}, {"$inc": {"total_earnings": creator_share, "balance": creator_share, "subscriber_count": 1}})
    updated_tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    return updated_tx

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        event = await stripe_checkout.handle_webhook(body, sig)
        if event.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
            if tx and tx["payment_status"] != "paid":
                await db.payment_transactions.update_one({"session_id": event.session_id}, {"$set": {"payment_status": "paid"}})
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============ GENRES ============
GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Mystery", "Mecha", "Isekai", "Thriller"]

@api_router.get("/genres")
async def get_genres():
    return {"genres": GENRES}

# ============ FEED ============
@api_router.get("/feed/featured")
async def get_featured():
    items = await db.series.find({}, {"_id": 0}).sort("like_count", -1).limit(5).to_list(5)
    return {"data": items}

@api_router.get("/feed/trending")
async def get_trending():
    items = await db.series.find({}, {"_id": 0}).sort("view_count", -1).limit(20).to_list(20)
    return {"data": items}

@api_router.get("/feed/latest")
async def get_latest():
    items = await db.series.find({}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    return {"data": items}

@api_router.get("/feed/top-creators")
async def get_top_creators():
    creators = await db.users.find({"is_creator": True}, {"_id": 0, "password_hash": 0}).sort("follower_count", -1).limit(10).to_list(10)
    return {"data": creators}

# ============ MY CONTENT (Creator Studio) ============
@api_router.get("/my/series")
async def my_series(user=Depends(get_current_user)):
    items = await db.series.find({"creator_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"data": items}

@api_router.get("/my/earnings")
async def my_earnings(user=Depends(get_current_user)):
    transactions = await db.payment_transactions.find({"creator_id": user["id"], "payment_status": "paid"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"transactions": transactions, "total_earnings": user.get("total_earnings", 0), "balance": user.get("balance", 0)}

# ============ CREATOR ANALYTICS DASHBOARD ============
@api_router.get("/analytics/creator")
async def get_creator_analytics(user=Depends(get_current_user)):
    if not user.get("is_creator"):
        raise HTTPException(status_code=403, detail="Not a creator")
    
    all_transactions = await db.payment_transactions.find(
        {"creator_id": user["id"], "payment_status": "paid"}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    tips_gross = sum(t["amount"] for t in all_transactions if t.get("type") == "tip")
    channel_subs_gross = sum(t["amount"] for t in all_transactions if t.get("type") == "channel_sub")
    total_gross = tips_gross + channel_subs_gross
    platform_fee = total_gross * PLATFORM_CUT
    total_net = total_gross - platform_fee
    
    supporter_ids = list(set(t.get("user_id") for t in all_transactions if t.get("user_id")))
    supporters = await db.users.find({"id": {"$in": supporter_ids}}, {"_id": 0, "password_hash": 0}).to_list(100)
    supporter_map = {s["id"]: s for s in supporters}
    
    supporter_totals = {}
    for t in all_transactions:
        uid = t.get("user_id")
        if uid:
            if uid not in supporter_totals:
                supporter_totals[uid] = {"tips": 0, "subs": 0, "total": 0, "count": 0}
            supporter_totals[uid]["total"] += t["amount"]
            supporter_totals[uid]["count"] += 1
            if t.get("type") == "tip":
                supporter_totals[uid]["tips"] += t["amount"]
            elif t.get("type") == "channel_sub":
                supporter_totals[uid]["subs"] += t["amount"]
    
    top_supporters = []
    for uid, stats in sorted(supporter_totals.items(), key=lambda x: x[1]["total"], reverse=True)[:20]:
        supporter_info = supporter_map.get(uid, {})
        top_supporters.append({
            "user_id": uid,
            "username": supporter_info.get("username", "Anonymous"),
            "avatar_color": supporter_info.get("avatar_color", "#00F0FF"),
            "total_amount": stats["total"],
            "tips_amount": stats["tips"],
            "subs_amount": stats["subs"],
            "transaction_count": stats["count"]
        })
    
    recent_transactions = []
    for t in all_transactions[:50]:
        supporter_info = supporter_map.get(t.get("user_id"), {})
        recent_transactions.append({
            **t,
            "supporter_username": supporter_info.get("username", "Anonymous"),
            "supporter_avatar_color": supporter_info.get("avatar_color", "#00F0FF"),
            "gross_amount": t["amount"],
            "platform_fee": t["amount"] * PLATFORM_CUT,
            "net_amount": t["amount"] * (1 - PLATFORM_CUT)
        })
    
    series_list = await db.series.find({"creator_id": user["id"]}, {"_id": 0}).to_list(50)
    total_views = sum(s.get("view_count", 0) for s in series_list)
    total_likes = sum(s.get("like_count", 0) for s in series_list)
    
    from datetime import timedelta
    monthly_data = []
    now = datetime.now(timezone.utc)
    for i in range(6):
        month_start = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        month_transactions = [t for t in all_transactions if month_start.isoformat() <= t.get("created_at", "") < month_end.isoformat()]
        month_gross = sum(t["amount"] for t in month_transactions)
        monthly_data.append({
            "month": month_start.strftime("%b %Y"),
            "gross_revenue": month_gross,
            "net_revenue": month_gross * (1 - PLATFORM_CUT),
            "transaction_count": len(month_transactions)
        })
    monthly_data.reverse()
    
    return {
        "summary": {
            "total_gross_revenue": total_gross,
            "total_platform_fee": platform_fee,
            "total_net_revenue": total_net,
            "tips_gross": tips_gross,
            "channel_subs_gross": channel_subs_gross,
            "available_balance": user.get("balance", 0),
            "total_supporters": len(supporter_ids),
            "total_transactions": len(all_transactions),
            "total_views": total_views,
            "total_likes": total_likes,
            "follower_count": user.get("follower_count", 0),
            "series_count": len(series_list),
            "platform_fee_percentage": PLATFORM_CUT * 100
        },
        "top_supporters": top_supporters,
        "recent_transactions": recent_transactions,
        "monthly_breakdown": monthly_data,
        "series_performance": sorted(series_list, key=lambda x: x.get("view_count", 0), reverse=True)
    }

# ============ FAN ANALYTICS DASHBOARD ============
@api_router.get("/analytics/fan")
async def get_fan_analytics(user=Depends(get_current_user)):
    all_transactions = await db.payment_transactions.find(
        {"user_id": user["id"], "payment_status": "paid"}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    tips_total = sum(t["amount"] for t in all_transactions if t.get("type") == "tip")
    premium_total = sum(t["amount"] for t in all_transactions if t.get("type") == "premium")
    channel_subs_total = sum(t["amount"] for t in all_transactions if t.get("type") == "channel_sub")
    total_spent = tips_total + premium_total + channel_subs_total
    
    creator_ids = list(set(t.get("creator_id") for t in all_transactions if t.get("creator_id")))
    creators = await db.users.find({"id": {"$in": creator_ids}}, {"_id": 0, "password_hash": 0}).to_list(100)
    creator_map = {c["id"]: c for c in creators}
    
    creator_totals = {}
    for t in all_transactions:
        cid = t.get("creator_id")
        if cid:
            if cid not in creator_totals:
                creator_totals[cid] = {"tips": 0, "subs": 0, "total": 0, "count": 0, "last_date": ""}
            creator_totals[cid]["total"] += t["amount"]
            creator_totals[cid]["count"] += 1
            if t.get("type") == "tip":
                creator_totals[cid]["tips"] += t["amount"]
            elif t.get("type") == "channel_sub":
                creator_totals[cid]["subs"] += t["amount"]
            if t.get("created_at", "") > creator_totals[cid]["last_date"]:
                creator_totals[cid]["last_date"] = t.get("created_at", "")
    
    supported_creators = []
    for cid, stats in sorted(creator_totals.items(), key=lambda x: x[1]["total"], reverse=True):
        creator_info = creator_map.get(cid, {})
        supported_creators.append({
            "creator_id": cid,
            "username": creator_info.get("username", "Unknown"),
            "avatar_color": creator_info.get("avatar_color", "#00F0FF"),
            "bio": creator_info.get("bio", ""),
            "total_given": stats["total"],
            "tips_given": stats["tips"],
            "subs_given": stats["subs"],
            "support_count": stats["count"],
            "last_support_date": stats["last_date"]
        })
    
    recent_transactions = []
    for t in all_transactions[:50]:
        creator_info = creator_map.get(t.get("creator_id"), {})
        recent_transactions.append({
            **t,
            "creator_username": creator_info.get("username", "Platform"),
            "creator_avatar_color": creator_info.get("avatar_color", "#00F0FF"),
        })
    
    from datetime import timedelta
    monthly_data = []
    now = datetime.now(timezone.utc)
    for i in range(6):
        month_start = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        month_transactions = [t for t in all_transactions if month_start.isoformat() <= t.get("created_at", "") < month_end.isoformat()]
        monthly_data.append({
            "month": month_start.strftime("%b %Y"),
            "total_spent": sum(t["amount"] for t in month_transactions),
            "tips": sum(t["amount"] for t in month_transactions if t.get("type") == "tip"),
            "subs": sum(t["amount"] for t in month_transactions if t.get("type") == "channel_sub"),
            "transaction_count": len(month_transactions)
        })
    monthly_data.reverse()
    
    following = await db.follows.find({"follower_id": user["id"]}, {"_id": 0}).to_list(100)
    following_ids = [f["following_id"] for f in following]
    
    return {
        "summary": {
            "total_spent": total_spent,
            "tips_total": tips_total,
            "premium_total": premium_total,
            "channel_subs_total": channel_subs_total,
            "creators_supported": len(creator_ids),
            "total_transactions": len(all_transactions),
            "following_count": len(following_ids),
            "is_premium": user.get("is_premium", False)
        },
        "supported_creators": supported_creators,
        "recent_transactions": recent_transactions,
        "monthly_spending": monthly_data
    }

# ============ SEED DATA ============
@api_router.post("/seed")
async def seed_data():
    existing = await db.series.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}

    creators = [
        {"id": str(uuid.uuid4()), "username": "SakuraStudio", "email": "sakura@demo.com", "password_hash": hash_password("demo123"), "avatar_color": "#FF0099", "bio": "Independent anime studio creating original stories", "is_creator": True, "is_premium": False, "follower_count": 1240, "following_count": 5, "total_earnings": 0.0, "balance": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "username": "NeonDreams", "email": "neon@demo.com", "password_hash": hash_password("demo123"), "avatar_color": "#00F0FF", "bio": "Cyberpunk anime creator | New episodes every week", "is_creator": True, "is_premium": False, "follower_count": 890, "following_count": 12, "total_earnings": 0.0, "balance": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "username": "MoonlitArts", "email": "moonlit@demo.com", "password_hash": hash_password("demo123"), "avatar_color": "#7000FF", "bio": "Fantasy & romance anime | Dreaming in color", "is_creator": True, "is_premium": False, "follower_count": 2100, "following_count": 8, "total_earnings": 0.0, "balance": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "username": "ThunderAnime", "email": "thunder@demo.com", "password_hash": hash_password("demo123"), "avatar_color": "#FFD600", "bio": "Action-packed original anime | Fight scenes specialist", "is_creator": True, "is_premium": False, "follower_count": 3400, "following_count": 3, "total_earnings": 0.0, "balance": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    for c in creators:
        await db.users.update_one({"email": c["email"]}, {"$set": c}, upsert=True)

    demo_series = [
        {"id": str(uuid.uuid4()), "creator_id": creators[0]["id"], "creator_name": "SakuraStudio", "creator_avatar_color": "#FF0099", "title": "Crimson Petals", "description": "A young warrior discovers she holds the power of the ancient sakura spirits. As dark forces threaten her village, she must master her abilities before it's too late.", "genre": "Fantasy", "tags": ["fantasy", "action", "magic"], "thumbnail_base64": None, "cover_base64": None, "episode_count": 6, "view_count": 15600, "like_count": 890, "subscriber_count": 340, "is_featured": True, "status": "ongoing", "created_at": "2026-01-15T10:00:00+00:00"},
        {"id": str(uuid.uuid4()), "creator_id": creators[1]["id"], "creator_name": "NeonDreams", "creator_avatar_color": "#00F0FF", "title": "Circuit Zero", "description": "In Neo-Tokyo 2099, a hacker discovers a conspiracy that could destroy the boundary between the digital and physical worlds. Jack in or log out forever.", "genre": "Sci-Fi", "tags": ["cyberpunk", "sci-fi", "thriller"], "thumbnail_base64": None, "cover_base64": None, "episode_count": 4, "view_count": 12300, "like_count": 720, "subscriber_count": 210, "is_featured": True, "status": "ongoing", "created_at": "2026-02-01T10:00:00+00:00"},
        {"id": str(uuid.uuid4()), "creator_id": creators[2]["id"], "creator_name": "MoonlitArts", "creator_avatar_color": "#7000FF", "title": "Starlight Academy", "description": "At a prestigious academy for gifted artists, two rivals discover that their magical paintings can bring worlds to life. But some creations should never exist.", "genre": "Romance", "tags": ["romance", "school", "magic"], "thumbnail_base64": None, "cover_base64": None, "episode_count": 8, "view_count": 23400, "like_count": 1850, "subscriber_count": 670, "is_featured": True, "status": "ongoing", "created_at": "2025-12-20T10:00:00+00:00"},
        {"id": str(uuid.uuid4()), "creator_id": creators[3]["id"], "creator_name": "ThunderAnime", "creator_avatar_color": "#FFD600", "title": "Iron Fist Legacy", "description": "The last martial arts master must train a new generation of fighters to defend Earth from interdimensional warriors. The tournament begins now.", "genre": "Action", "tags": ["action", "martial-arts", "tournament"], "thumbnail_base64": None, "cover_base64": None, "episode_count": 12, "view_count": 45200, "like_count": 3200, "subscriber_count": 1100, "is_featured": True, "status": "ongoing", "created_at": "2025-11-10T10:00:00+00:00"},
        {"id": str(uuid.uuid4()), "creator_id": creators[0]["id"], "creator_name": "SakuraStudio", "creator_avatar_color": "#FF0099", "title": "Whispers in the Rain", "description": "A gentle slice of life story about a cafe owner who can hear the stories of anyone who enters during rainfall.", "genre": "Slice of Life", "tags": ["slice-of-life", "drama", "cozy"], "thumbnail_base64": None, "cover_base64": None, "episode_count": 3, "view_count": 8900, "like_count": 560, "subscriber_count": 180, "is_featured": False, "status": "ongoing", "created_at": "2026-03-01T10:00:00+00:00"},
        {"id": str(uuid.uuid4()), "creator_id": creators[1]["id"], "creator_name": "NeonDreams", "creator_avatar_color": "#00F0FF", "title": "Ghost Protocol", "description": "Elite cyber-agents hunt digital ghosts that have escaped into the real world. Each ghost carries a fragment of a forbidden AI.", "genre": "Thriller", "tags": ["thriller", "cyber", "mystery"], "thumbnail_base64": None, "cover_base64": None, "episode_count": 5, "view_count": 9700, "like_count": 410, "subscriber_count": 150, "is_featured": False, "status": "ongoing", "created_at": "2026-02-20T10:00:00+00:00"},
    ]
    for s in demo_series:
        await db.series.insert_one(s)

    return {"message": "Seeded successfully", "creators": len(creators), "series": len(demo_series)}

# ============ HEALTH ============
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "anime-world-api"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

FRONTEND_DIST = ROOT_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIST)), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return {"detail": "Not found"}