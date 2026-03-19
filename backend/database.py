"""
MongoDB connection management and database initialization.

Provides a DatabaseManager singleton that handles connection pooling,
index creation, and health checks. Import `get_db()` in route modules
to obtain the active database handle.
"""

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel

from backend.config import get_settings
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
)

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Manages the Motor async MongoDB client lifecycle.

    Usage::

        # In FastAPI lifespan or startup event:
        await db_manager.connect()

        # In route handlers (via Depends):
        db = get_db()

        # On shutdown:
        await db_manager.disconnect()
    """

    def __init__(self) -> None:
        self._client: Optional[AsyncIOMotorClient] = None
        self._db: Optional[AsyncIOMotorDatabase] = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self) -> None:
        """Open the connection pool and create required indexes."""
        settings = get_settings()
        logger.info(
            "Connecting to MongoDB",
            extra={"db_name": settings.DB_NAME, "environment": settings.ENVIRONMENT},
        )
        self._client = AsyncIOMotorClient(
            settings.MONGO_URL,
            minPoolSize=settings.DB_MIN_POOL_SIZE,
            maxPoolSize=settings.DB_MAX_POOL_SIZE,
            connectTimeoutMS=settings.DB_CONNECT_TIMEOUT_MS,
            serverSelectionTimeoutMS=settings.DB_SERVER_SELECTION_TIMEOUT_MS,
        )
        self._db = self._client[settings.DB_NAME]
        await self._create_indexes()
        logger.info("MongoDB connection established.")

    async def disconnect(self) -> None:
        """Close the connection pool gracefully."""
        if self._client:
            self._client.close()
            logger.info("MongoDB connection closed.")

    # ------------------------------------------------------------------
    # Database handle
    # ------------------------------------------------------------------

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("DatabaseManager.connect() has not been called.")
        return self._db

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------

    async def ping(self) -> bool:
        """Return True if the database is reachable."""
        try:
            await self._client.admin.command("ping")  # type: ignore[union-attr]
            return True
        except Exception as exc:
            logger.error("MongoDB ping failed: %s", exc)
            return False

    # ------------------------------------------------------------------
    # Index creation
    # ------------------------------------------------------------------

    async def _create_indexes(self) -> None:
        """Idempotently create all required indexes."""
        db = self._db
        assert db is not None

        # Users
        await db[COL_USERS].create_indexes([
            IndexModel([("email", ASCENDING)], unique=True, name="email_unique"),
            IndexModel([("username", ASCENDING)], unique=True, name="username_unique"),
            IndexModel([("id", ASCENDING)], unique=True, name="id_unique"),
            IndexModel([("is_creator", ASCENDING)], name="is_creator"),
            IndexModel([("follower_count", DESCENDING)], name="follower_count_desc"),
        ])

        # Series
        await db[COL_SERIES].create_indexes([
            IndexModel([("id", ASCENDING)], unique=True, name="id_unique"),
            IndexModel([("creator_id", ASCENDING)], name="creator_id"),
            IndexModel([("genre", ASCENDING)], name="genre"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("view_count", DESCENDING)], name="view_count_desc"),
            IndexModel([("like_count", DESCENDING)], name="like_count_desc"),
            IndexModel([("title", ASCENDING)], name="title_text"),
            IndexModel([("deleted_at", ASCENDING)], name="deleted_at", sparse=True),
        ])

        # Episodes
        await db[COL_EPISODES].create_indexes([
            IndexModel([("id", ASCENDING)], unique=True, name="id_unique"),
            IndexModel([("series_id", ASCENDING)], name="series_id"),
            IndexModel([("series_id", ASCENDING), ("episode_number", ASCENDING)], name="series_episode_num"),
            IndexModel([("creator_id", ASCENDING)], name="creator_id"),
        ])

        # Comments
        await db[COL_COMMENTS].create_indexes([
            IndexModel([("id", ASCENDING)], unique=True, name="id_unique"),
            IndexModel([("content_type", ASCENDING), ("content_id", ASCENDING)], name="content"),
            IndexModel([("parent_id", ASCENDING)], name="parent_id", sparse=True),
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
        ])

        # Comment likes
        await db[COL_COMMENT_LIKES].create_indexes([
            IndexModel(
                [("comment_id", ASCENDING), ("user_id", ASCENDING)],
                unique=True,
                name="comment_user_unique",
            ),
        ])

        # Notifications
        await db[COL_NOTIFICATIONS].create_indexes([
            IndexModel([("id", ASCENDING)], unique=True, name="id_unique"),
            IndexModel([("user_id", ASCENDING), ("read", ASCENDING)], name="user_read"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
        ])

        # Reports
        await db[COL_REPORTS].create_indexes([
            IndexModel([("id", ASCENDING)], unique=True, name="id_unique"),
            IndexModel([("content_creator_id", ASCENDING)], name="content_creator_id"),
            IndexModel([("status", ASCENDING)], name="status"),
        ])

        # Follows
        await db[COL_FOLLOWS].create_indexes([
            IndexModel(
                [("follower_id", ASCENDING), ("following_id", ASCENDING)],
                unique=True,
                name="follow_unique",
            ),
            IndexModel([("following_id", ASCENDING)], name="following_id"),
        ])

        # Watchlist
        await db[COL_WATCHLIST].create_indexes([
            IndexModel(
                [("user_id", ASCENDING), ("series_id", ASCENDING)],
                unique=True,
                name="user_series_unique",
            ),
        ])

        # Likes
        await db[COL_LIKES].create_indexes([
            IndexModel(
                [("user_id", ASCENDING), ("series_id", ASCENDING)],
                unique=True,
                name="user_series_unique",
            ),
        ])

        # Reading progress
        await db[COL_READING_PROGRESS].create_indexes([
            IndexModel(
                [("user_id", ASCENDING), ("series_id", ASCENDING), ("episode_id", ASCENDING)],
                unique=True,
                name="user_series_episode_unique",
            ),
            IndexModel([("user_id", ASCENDING), ("completed", ASCENDING)], name="user_completed"),
            IndexModel([("updated_at", DESCENDING)], name="updated_at_desc"),
        ])

        # Password resets
        await db[COL_PASSWORD_RESETS].create_indexes([
            IndexModel([("token", ASCENDING)], unique=True, name="token_unique"),
            IndexModel([("email", ASCENDING)], name="email"),
        ])

        # Profiles
        await db[COL_PROFILES].create_indexes([
            IndexModel([("id", ASCENDING)], unique=True, name="id_unique"),
            IndexModel([("user_id", ASCENDING)], name="user_id"),
        ])

        # Watch history
        await db[COL_HISTORY].create_indexes([
            IndexModel(
                [("user_id", ASCENDING), ("anime_id", ASCENDING), ("episode_number", ASCENDING)],
                unique=True,
                name="user_anime_episode_unique",
            ),
            IndexModel([("user_id", ASCENDING), ("updated_at", DESCENDING)], name="user_updated"),
        ])

        # Refresh tokens
        await db[COL_REFRESH_TOKENS].create_indexes([
            IndexModel([("token", ASCENDING)], unique=True, name="token_unique"),
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("expires_at", ASCENDING)], name="expires_at", expireAfterSeconds=0),
        ])

        # Audit log
        await db[COL_AUDIT_LOG].create_indexes([
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("action", ASCENDING)], name="action"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
        ])

        logger.info("Database indexes verified/created.")


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

db_manager = DatabaseManager()


def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency — returns the active database handle."""
    return db_manager.db
