from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
import httpx
import jwt
import bcrypt
import asyncio
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'anime_app')]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'anime-cotton-candy-secret-key-2026')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Jikan API
JIKAN_BASE_URL = "https://api.jikan.moe/v4"

app = FastAPI(title="Anime Streamer API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ JIKAN CACHE ============
_cache: Dict[str, tuple] = {}
CACHE_TTL = 3600  # 1 hour
_last_request_time = 0.0
_request_lock = asyncio.Lock()


async def jikan_fetch(endpoint: str, params: Optional[dict] = None) -> Dict[str, Any]:
    global _last_request_time
    cache_key = f"{endpoint}_{str(sorted((params or {}).items()))}"

    if cache_key in _cache:
        data, cached_at = _cache[cache_key]
        if time.time() - cached_at < CACHE_TTL:
            return data

    async with _request_lock:
        now = time.time()
        wait_time = max(0, 0.35 - (now - _last_request_time))
        if wait_time > 0:
            await asyncio.sleep(wait_time)

        try:
            async with httpx.AsyncClient(timeout=15.0) as http_client:
                resp = await http_client.get(f"{JIKAN_BASE_URL}{endpoint}", params=params)
                _last_request_time = time.time()
                if resp.status_code == 429:
                    await asyncio.sleep(1)
                    resp = await http_client.get(f"{JIKAN_BASE_URL}{endpoint}", params=params)
                    _last_request_time = time.time()
                resp.raise_for_status()
                data = resp.json()
                _cache[cache_key] = (data, time.time())
                return data
        except httpx.HTTPStatusError as e:
            logger.error(f"Jikan API error {e.response.status_code}: {endpoint}")
            raise HTTPException(status_code=e.response.status_code, detail="Jikan API error")
        except Exception as e:
            logger.error(f"Jikan fetch error: {str(e)}")
            raise HTTPException(status_code=502, detail="Failed to fetch from anime API")


# ============ AUTH MODELS ============
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    avatar_url: Optional[str] = None
    created_at: str

class WatchlistItem(BaseModel):
    anime_id: int
    title: str
    image_url: str
    score: Optional[float] = None
    episodes: Optional[int] = None
    status: Optional[str] = None

class WatchHistoryItem(BaseModel):
    anime_id: int
    episode_number: int
    title: str
    anime_title: str
    image_url: str
    progress: float = 0.0


# ============ AUTH HELPERS ============
def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


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


# ============ AUTH ROUTES ============
@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await db.users.find_one({"username": data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": data.username,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": data.username,
            "email": data.email,
            "avatar_url": None,
            "created_at": user_doc["created_at"]
        }
    }


@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "avatar_url": user.get("avatar_url"),
            "created_at": user["created_at"]
        }
    }


@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "avatar_url": user.get("avatar_url"),
        "created_at": user["created_at"]
    }


# ============ ANIME ROUTES ============
@api_router.get("/anime/search")
async def search_anime(q: str = Query(..., min_length=1), page: int = Query(1, ge=1)):
    result = await jikan_fetch("/anime", {"q": q, "page": page, "limit": 20, "sfw": "true"})
    return result


@api_router.get("/anime/top")
async def get_top_anime(
    filter: str = Query("airing", regex="^(airing|upcoming|bypopularity|favorite)$"),
    page: int = Query(1, ge=1)
):
    result = await jikan_fetch("/top/anime", {"filter": filter, "page": page, "limit": 20, "sfw": "true"})
    return result


@api_router.get("/anime/seasonal")
async def get_seasonal_anime(
    year: int = Query(2025),
    season: str = Query("winter", regex="^(winter|spring|summer|fall)$"),
    page: int = Query(1, ge=1)
):
    result = await jikan_fetch(f"/seasons/{year}/{season}", {"page": page, "limit": 20, "sfw": "true"})
    return result


@api_router.get("/anime/genres")
async def get_genres():
    result = await jikan_fetch("/genres/anime")
    return result


@api_router.get("/anime/{anime_id}")
async def get_anime_detail(anime_id: int):
    result = await jikan_fetch(f"/anime/{anime_id}/full")
    return result


@api_router.get("/anime/{anime_id}/episodes")
async def get_anime_episodes(anime_id: int, page: int = Query(1, ge=1)):
    result = await jikan_fetch(f"/anime/{anime_id}/episodes", {"page": page})
    return result


@api_router.get("/anime/{anime_id}/recommendations")
async def get_anime_recommendations(anime_id: int):
    result = await jikan_fetch(f"/anime/{anime_id}/recommendations")
    return result


# ============ WATCHLIST ROUTES ============
@api_router.get("/watchlist")
async def get_watchlist(user=Depends(get_current_user)):
    items = await db.watchlist.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).to_list(100)
    return {"items": items}


@api_router.post("/watchlist")
async def add_to_watchlist(item: WatchlistItem, user=Depends(get_current_user)):
    existing = await db.watchlist.find_one(
        {"user_id": user["id"], "anime_id": item.anime_id}, {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "anime_id": item.anime_id,
        "title": item.title,
        "image_url": item.image_url,
        "score": item.score,
        "episodes": item.episodes,
        "status": item.status,
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    await db.watchlist.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/watchlist/{anime_id}")
async def remove_from_watchlist(anime_id: int, user=Depends(get_current_user)):
    result = await db.watchlist.delete_one({"user_id": user["id"], "anime_id": anime_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in watchlist")
    return {"message": "Removed from watchlist"}


@api_router.get("/watchlist/check/{anime_id}")
async def check_watchlist(anime_id: int, user=Depends(get_current_user)):
    item = await db.watchlist.find_one(
        {"user_id": user["id"], "anime_id": anime_id}, {"_id": 0}
    )
    return {"in_watchlist": item is not None}


# ============ WATCH HISTORY ROUTES ============
@api_router.post("/history")
async def update_watch_history(item: WatchHistoryItem, user=Depends(get_current_user)):
    doc = {
        "user_id": user["id"],
        "anime_id": item.anime_id,
        "episode_number": item.episode_number,
        "title": item.title,
        "anime_title": item.anime_title,
        "image_url": item.image_url,
        "progress": item.progress,
        "watched_at": datetime.now(timezone.utc).isoformat()
    }
    await db.watch_history.update_one(
        {"user_id": user["id"], "anime_id": item.anime_id, "episode_number": item.episode_number},
        {"$set": doc},
        upsert=True
    )
    return {"message": "History updated"}


@api_router.get("/history")
async def get_watch_history(user=Depends(get_current_user)):
    items = await db.watch_history.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("watched_at", -1).to_list(50)
    return {"items": items}


# ============ HEALTH ============
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "anime-streamer-api"}


# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
