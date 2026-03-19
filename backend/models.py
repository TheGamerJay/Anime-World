"""
Repository pattern — one class per MongoDB collection.

Each repository encapsulates all database access for its entity,
keeping route handlers free of raw Motor/PyMongo calls. Repositories
receive the database handle via dependency injection so they can be
easily swapped for test doubles.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.constants import (
    COL_AUDIT_LOG,
    COL_COMMENT_LIKES,
    COL_COMMENTS,
    COL_EPISODES,
    COL_FOLLOWS,
    COL_HISTORY,
    COL_LIKES,
    COL_NOTIFICATIONS,
    COL_PASSWORD_RESETS,
    COL_PROFILES,
    COL_READING_PROGRESS,
    COL_REFRESH_TOKENS,
    COL_REPORTS,
    COL_SERIES,
    COL_USERS,
    COL_WATCHLIST,
    DEFAULT_AVATAR_COLOR,
    MAX_PROFILES_PER_USER,
)
from backend.utils import new_id, strip_mongo_id, utcnow_iso

logger = logging.getLogger(__name__)

# Projection that excludes MongoDB's internal _id and the password hash
_SAFE_USER_PROJ = {"_id": 0, "password_hash": 0}
_NO_ID = {"_id": 0}


# ---------------------------------------------------------------------------
# Base repository
# ---------------------------------------------------------------------------

class BaseRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db


# ---------------------------------------------------------------------------
# User repository
# ---------------------------------------------------------------------------

class UserRepository(BaseRepository):
    """CRUD operations for the users collection."""

    @property
    def _col(self):
        return self._db[COL_USERS]

    async def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"id": user_id}, _NO_ID)

    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"email": email}, _NO_ID)

    async def find_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"username": username}, _NO_ID)

    async def create(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        await self._col.insert_one(doc)
        return strip_mongo_id(doc)

    async def update(self, user_id: str, fields: Dict[str, Any]) -> None:
        await self._col.update_one({"id": user_id}, {"$set": fields})

    async def increment(self, user_id: str, fields: Dict[str, int]) -> None:
        await self._col.update_one({"id": user_id}, {"$inc": fields})

    async def safe_find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Return user without password_hash."""
        return await self._col.find_one({"id": user_id}, _SAFE_USER_PROJ)

    async def list_creators(self, limit: int = 10) -> List[Dict[str, Any]]:
        return (
            await self._col.find({"is_creator": True}, _SAFE_USER_PROJ)
            .sort("follower_count", -1)
            .limit(limit)
            .to_list(limit)
        )


# ---------------------------------------------------------------------------
# Series repository
# ---------------------------------------------------------------------------

class SeriesRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_SERIES]

    async def find_by_id(self, series_id: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"id": series_id}, _NO_ID)

    async def find_by_id_and_creator(
        self, series_id: str, creator_id: str
    ) -> Optional[Dict[str, Any]]:
        return await self._col.find_one(
            {"id": series_id, "creator_id": creator_id}, _NO_ID
        )

    async def create(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        await self._col.insert_one(doc)
        return strip_mongo_id(doc)

    async def update(self, series_id: str, fields: Dict[str, Any]) -> None:
        fields["updated_at"] = utcnow_iso()
        await self._col.update_one({"id": series_id}, {"$set": fields})

    async def increment(self, series_id: str, fields: Dict[str, int]) -> None:
        await self._col.update_one({"id": series_id}, {"$inc": fields})

    async def delete(self, series_id: str) -> None:
        await self._col.delete_one({"id": series_id})

    async def list(
        self,
        query: Dict[str, Any],
        sort_field: str,
        sort_dir: int,
        skip: int,
        limit: int,
    ) -> Tuple[List[Dict[str, Any]], int]:
        cursor = (
            self._col.find(query, _NO_ID)
            .sort(sort_field, sort_dir)
            .skip(skip)
            .limit(limit)
        )
        items = await cursor.to_list(limit)
        total = await self._col.count_documents(query)
        return items, total

    async def search(self, q: str, limit: int = 20) -> List[Dict[str, Any]]:
        import re
        pattern = re.escape(q.strip())
        return (
            await self._col.find(
                {"title": {"$regex": pattern, "$options": "i"}}, _NO_ID
            )
            .limit(limit)
            .to_list(limit)
        )

    async def list_by_creator(self, creator_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return (
            await self._col.find({"creator_id": creator_id}, _NO_ID)
            .sort("created_at", -1)
            .limit(limit)
            .to_list(limit)
        )

    async def increment_view(self, series_id: str) -> None:
        await self.increment(series_id, {"view_count": 1})


# ---------------------------------------------------------------------------
# Episode repository
# ---------------------------------------------------------------------------

class EpisodeRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_EPISODES]

    async def find_by_id(self, episode_id: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"id": episode_id}, _NO_ID)

    async def find_by_id_and_creator(
        self, episode_id: str, creator_id: str
    ) -> Optional[Dict[str, Any]]:
        return await self._col.find_one(
            {"id": episode_id, "creator_id": creator_id}, _NO_ID
        )

    async def list_by_series(self, series_id: str) -> List[Dict[str, Any]]:
        return (
            await self._col.find({"series_id": series_id}, _NO_ID)
            .sort("episode_number", 1)
            .to_list(500)
        )

    async def create(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        await self._col.insert_one(doc)
        return strip_mongo_id(doc)

    async def delete(self, episode_id: str) -> None:
        await self._col.delete_one({"id": episode_id})

    async def delete_by_series(self, series_id: str) -> None:
        await self._col.delete_many({"series_id": series_id})

    async def increment_view(self, episode_id: str) -> None:
        await self._col.update_one({"id": episode_id}, {"$inc": {"view_count": 1}})


# ---------------------------------------------------------------------------
# Comment repository
# ---------------------------------------------------------------------------

class CommentRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_COMMENTS]

    async def find_by_id(self, comment_id: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"id": comment_id}, _NO_ID)

    async def create(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        await self._col.insert_one(doc)
        return strip_mongo_id(doc)

    async def delete(self, comment_id: str) -> None:
        await self._col.delete_one({"id": comment_id})

    async def delete_replies(self, parent_id: str) -> None:
        await self._col.delete_many({"parent_id": parent_id})

    async def list_top_level(
        self,
        content_type: str,
        content_id: str,
        skip: int,
        limit: int,
    ) -> Tuple[List[Dict[str, Any]], int]:
        query = {"content_type": content_type, "content_id": content_id, "parent_id": None}
        items = (
            await self._col.find(query, _NO_ID)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
            .to_list(limit)
        )
        total = await self._col.count_documents(query)
        return items, total

    async def list_replies(self, parent_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        return (
            await self._col.find({"parent_id": parent_id}, _NO_ID)
            .sort("created_at", 1)
            .limit(limit)
            .to_list(limit)
        )

    async def count_replies(self, parent_id: str) -> int:
        return await self._col.count_documents({"parent_id": parent_id})

    async def increment_like(self, comment_id: str, delta: int) -> None:
        await self._col.update_one({"id": comment_id}, {"$inc": {"like_count": delta}})


class CommentLikeRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_COMMENT_LIKES]

    async def exists(self, comment_id: str, user_id: str) -> bool:
        doc = await self._col.find_one({"comment_id": comment_id, "user_id": user_id})
        return doc is not None

    async def create(self, comment_id: str, user_id: str) -> None:
        await self._col.insert_one(
            {"comment_id": comment_id, "user_id": user_id, "created_at": utcnow_iso()}
        )

    async def delete(self, comment_id: str, user_id: str) -> None:
        await self._col.delete_one({"comment_id": comment_id, "user_id": user_id})


# ---------------------------------------------------------------------------
# Notification repository
# ---------------------------------------------------------------------------

class NotificationRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_NOTIFICATIONS]

    async def create(
        self,
        user_id: str,
        notif_type: str,
        message: str,
        related_id: Optional[str] = None,
    ) -> None:
        doc = {
            "id": new_id(),
            "user_id": user_id,
            "type": notif_type,
            "message": message,
            "related_id": related_id,
            "read": False,
            "created_at": utcnow_iso(),
        }
        await self._col.insert_one(doc)

    async def list_for_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return (
            await self._col.find({"user_id": user_id}, _NO_ID)
            .sort("created_at", -1)
            .limit(limit)
            .to_list(limit)
        )

    async def unread_count(self, user_id: str) -> int:
        return await self._col.count_documents({"user_id": user_id, "read": False})

    async def mark_all_read(self, user_id: str) -> None:
        await self._col.update_many(
            {"user_id": user_id, "read": False}, {"$set": {"read": True}}
        )

    async def mark_one_read(self, notif_id: str, user_id: str) -> None:
        await self._col.update_one(
            {"id": notif_id, "user_id": user_id}, {"$set": {"read": True}}
        )

    async def delete(self, notif_id: str, user_id: str) -> None:
        await self._col.delete_one({"id": notif_id, "user_id": user_id})


# ---------------------------------------------------------------------------
# Follow repository
# ---------------------------------------------------------------------------

class FollowRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_FOLLOWS]

    async def exists(self, follower_id: str, following_id: str) -> bool:
        doc = await self._col.find_one(
            {"follower_id": follower_id, "following_id": following_id}
        )
        return doc is not None

    async def create(self, follower_id: str, following_id: str) -> None:
        await self._col.insert_one(
            {
                "follower_id": follower_id,
                "following_id": following_id,
                "created_at": utcnow_iso(),
            }
        )

    async def delete(self, follower_id: str, following_id: str) -> int:
        result = await self._col.delete_one(
            {"follower_id": follower_id, "following_id": following_id}
        )
        return result.deleted_count


# ---------------------------------------------------------------------------
# Watchlist repository
# ---------------------------------------------------------------------------

class WatchlistRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_WATCHLIST]

    async def list_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        return await self._col.find({"user_id": user_id}, _NO_ID).to_list(500)

    async def exists(self, user_id: str, series_id: str) -> bool:
        doc = await self._col.find_one({"user_id": user_id, "series_id": series_id})
        return doc is not None

    async def add(self, doc: Dict[str, Any]) -> None:
        await self._col.insert_one(doc)

    async def remove(self, user_id: str, series_id: str) -> int:
        result = await self._col.delete_one({"user_id": user_id, "series_id": series_id})
        return result.deleted_count


# ---------------------------------------------------------------------------
# Likes repository
# ---------------------------------------------------------------------------

class LikeRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_LIKES]

    async def exists(self, user_id: str, series_id: str) -> bool:
        doc = await self._col.find_one({"user_id": user_id, "series_id": series_id})
        return doc is not None

    async def create(self, user_id: str, series_id: str) -> None:
        await self._col.insert_one(
            {"user_id": user_id, "series_id": series_id, "created_at": utcnow_iso()}
        )

    async def delete(self, user_id: str, series_id: str) -> None:
        await self._col.delete_one({"user_id": user_id, "series_id": series_id})


# ---------------------------------------------------------------------------
# Reading progress repository
# ---------------------------------------------------------------------------

class ReadingProgressRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_READING_PROGRESS]

    async def upsert(
        self,
        user_id: str,
        series_id: str,
        episode_id: str,
        progress: float,
        completed: bool,
    ) -> None:
        await self._col.update_one(
            {"user_id": user_id, "series_id": series_id, "episode_id": episode_id},
            {
                "$set": {
                    "user_id": user_id,
                    "series_id": series_id,
                    "episode_id": episode_id,
                    "progress": progress,
                    "completed": completed,
                    "updated_at": utcnow_iso(),
                }
            },
            upsert=True,
        )

    async def list_by_series(self, user_id: str, series_id: str) -> List[Dict[str, Any]]:
        return await self._col.find(
            {"user_id": user_id, "series_id": series_id}, _NO_ID
        ).to_list(500)

    async def list_in_progress(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        return (
            await self._col.find(
                {"user_id": user_id, "completed": False, "progress": {"$gt": 0}},
                _NO_ID,
            )
            .sort("updated_at", -1)
            .limit(limit)
            .to_list(limit)
        )


# ---------------------------------------------------------------------------
# Password reset repository
# ---------------------------------------------------------------------------

class PasswordResetRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_PASSWORD_RESETS]

    async def upsert(self, email: str, token: str) -> None:
        await self._col.update_one(
            {"email": email},
            {"$set": {"email": email, "token": token, "created_at": utcnow_iso()}},
            upsert=True,
        )

    async def find_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"token": token}, _NO_ID)

    async def delete(self, token: str) -> None:
        await self._col.delete_one({"token": token})


# ---------------------------------------------------------------------------
# Profile repository (sub-profiles)
# ---------------------------------------------------------------------------

class ProfileRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_PROFILES]

    async def list_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        return await self._col.find({"user_id": user_id}, _NO_ID).to_list(10)

    async def count_for_user(self, user_id: str) -> int:
        return await self._col.count_documents({"user_id": user_id})

    async def find_by_id(self, profile_id: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"id": profile_id}, _NO_ID)

    async def find_by_id_and_user(
        self, profile_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"id": profile_id, "user_id": user_id}, _NO_ID)

    async def create(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        await self._col.insert_one(doc)
        return strip_mongo_id(doc)

    async def set_active(self, user_id: str, profile_id: str) -> None:
        """Deactivate all profiles for user, then activate the given one."""
        await self._col.update_many({"user_id": user_id}, {"$set": {"is_active": False}})
        await self._col.update_one({"id": profile_id}, {"$set": {"is_active": True}})

    async def delete(self, profile_id: str) -> None:
        await self._col.delete_one({"id": profile_id})


# ---------------------------------------------------------------------------
# Watch history repository
# ---------------------------------------------------------------------------

class WatchHistoryRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_HISTORY]

    async def list_for_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return (
            await self._col.find({"user_id": user_id}, _NO_ID)
            .sort("updated_at", -1)
            .limit(limit)
            .to_list(limit)
        )

    async def upsert(self, user_id: str, doc: Dict[str, Any]) -> None:
        await self._col.update_one(
            {
                "user_id": user_id,
                "anime_id": doc["anime_id"],
                "episode_number": doc["episode_number"],
            },
            {"$set": {**doc, "updated_at": utcnow_iso()}},
            upsert=True,
        )


# ---------------------------------------------------------------------------
# Refresh token repository
# ---------------------------------------------------------------------------

class RefreshTokenRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_REFRESH_TOKENS]

    async def store(self, user_id: str, token: str, expires_at: str) -> None:
        await self._col.insert_one(
            {"user_id": user_id, "token": token, "expires_at": expires_at, "created_at": utcnow_iso()}
        )

    async def find(self, token: str) -> Optional[Dict[str, Any]]:
        return await self._col.find_one({"token": token}, _NO_ID)

    async def revoke(self, token: str) -> None:
        await self._col.delete_one({"token": token})

    async def revoke_all_for_user(self, user_id: str) -> None:
        await self._col.delete_many({"user_id": user_id})


# ---------------------------------------------------------------------------
# Audit log repository
# ---------------------------------------------------------------------------

class AuditLogRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_AUDIT_LOG]

    async def log(
        self,
        user_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        await self._col.insert_one(
            {
                "id": new_id(),
                "user_id": user_id,
                "action": action,
                "details": details or {},
                "ip_address": ip_address,
                "created_at": utcnow_iso(),
            }
        )


# ---------------------------------------------------------------------------
# Report repository
# ---------------------------------------------------------------------------

class ReportRepository(BaseRepository):
    @property
    def _col(self):
        return self._db[COL_REPORTS]

    async def create(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        await self._col.insert_one(doc)
        return strip_mongo_id(doc)

    async def list_for_creator(
        self, creator_id: str, status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"content_creator_id": creator_id}
        if status:
            query["status"] = status
        return (
            await self._col.find(query, _NO_ID)
            .sort("created_at", -1)
            .limit(100)
            .to_list(100)
        )
