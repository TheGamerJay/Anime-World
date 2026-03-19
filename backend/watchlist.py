"""
Watchlist, likes, watch history, reading progress, and feed routes.

Endpoints:
    GET    /api/v1/watchlist
    POST   /api/v1/watchlist
    GET    /api/v1/watchlist/check/{series_id}
    DELETE /api/v1/watchlist/{series_id}
    POST   /api/v1/like/series/{series_id}
    GET    /api/v1/like/check/{series_id}
    POST   /api/v1/progress
    GET    /api/v1/progress/{series_id}
    GET    /api/v1/continue-watching
    GET    /api/v1/history
    POST   /api/v1/history
    GET    /api/v1/feed/featured
    GET    /api/v1/feed/trending
    GET    /api/v1/feed/latest
    GET    /api/v1/feed/top-creators
    GET    /api/v1/genres
    GET    /api/v1/reports
    POST   /api/v1/reports
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends

from backend.auth import get_current_user
from backend.constants import GENRES
from backend.database import get_db
from backend.exceptions import BadRequestError, NotFoundError, SeriesNotFoundError
from backend.models import (
    EpisodeRepository,
    LikeRepository,
    ReadingProgressRepository,
    ReportRepository,
    SeriesRepository,
    UserRepository,
    WatchHistoryRepository,
    WatchlistRepository,
)
from backend.schemas import (
    MessageResponse,
    ReadingProgressUpdateRequest,
    ReportCreateRequest,
    WatchHistoryUpdateRequest,
    WatchlistAddRequest,
)
from backend.utils import new_id, utcnow_iso

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Watchlist & Feed"])


# ---------------------------------------------------------------------------
# Watchlist
# ---------------------------------------------------------------------------

@router.get("/watchlist", response_model=dict, status_code=200)
async def get_watchlist(user=Depends(get_current_user), db=Depends(get_db)):
    """Return all watchlist items for the authenticated user."""
    repo = WatchlistRepository(db)
    items = await repo.list_for_user(user["id"])
    return {"items": items}


@router.post("/watchlist", response_model=dict, status_code=200)
async def add_to_watchlist(
    data: WatchlistAddRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Add an anime to the watchlist.

    Raises 400 if the item is already in the watchlist.
    """
    repo = WatchlistRepository(db)
    series_id = str(data.anime_id)

    if await repo.exists(user["id"], series_id):
        raise BadRequestError("Already in watchlist.")

    doc = {
        "user_id": user["id"],
        "series_id": series_id,
        "anime_id": data.anime_id,
        "title": data.title,
        "image_url": data.image_url,
        "score": data.score,
        "episodes": data.episodes,
        "status": data.status,
        "id": new_id(),
        "added_at": utcnow_iso(),
    }
    await repo.add(doc)
    doc.pop("_id", None)
    return doc


@router.get("/watchlist/check/{anime_id}", response_model=dict, status_code=200)
async def check_watchlist(
    anime_id: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Check whether a given anime is in the user's watchlist."""
    repo = WatchlistRepository(db)
    in_watchlist = await repo.exists(user["id"], str(anime_id))
    return {"in_watchlist": in_watchlist}


@router.delete("/watchlist/{anime_id}", response_model=MessageResponse, status_code=200)
async def remove_from_watchlist(
    anime_id: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Remove an anime from the watchlist."""
    repo = WatchlistRepository(db)
    deleted = await repo.remove(user["id"], str(anime_id))
    if not deleted:
        raise NotFoundError("Item not in watchlist.")
    return MessageResponse(message="Removed from watchlist.")


# ---------------------------------------------------------------------------
# Likes
# ---------------------------------------------------------------------------

@router.post("/like/series/{series_id}", response_model=dict, status_code=200)
async def like_series(
    series_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Toggle a like on a series. Returns the new liked state."""
    series_repo = SeriesRepository(db)
    if not await series_repo.find_by_id(series_id):
        raise SeriesNotFoundError()

    like_repo = LikeRepository(db)
    if await like_repo.exists(user["id"], series_id):
        await like_repo.delete(user["id"], series_id)
        await series_repo.increment(series_id, {"like_count": -1})
        return {"liked": False}

    await like_repo.create(user["id"], series_id)
    await series_repo.increment(series_id, {"like_count": 1})
    return {"liked": True}


@router.get("/like/check/{series_id}", response_model=dict, status_code=200)
async def check_like(
    series_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Check whether the authenticated user has liked a series."""
    like_repo = LikeRepository(db)
    liked = await like_repo.exists(user["id"], series_id)
    return {"liked": liked}


# ---------------------------------------------------------------------------
# Reading / watch progress
# ---------------------------------------------------------------------------

@router.post("/progress", response_model=MessageResponse, status_code=200)
async def update_progress(
    data: ReadingProgressUpdateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Save or update watch/reading progress for an episode."""
    repo = ReadingProgressRepository(db)
    await repo.upsert(
        user["id"], data.series_id, data.episode_id, data.progress, data.completed
    )
    return MessageResponse(message="Progress saved.")


@router.get("/progress/{series_id}", response_model=dict, status_code=200)
async def get_series_progress(
    series_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Return all progress records for a series."""
    repo = ReadingProgressRepository(db)
    progress_list = await repo.list_by_series(user["id"], series_id)
    return {"progress": progress_list}


@router.get("/continue-watching", response_model=dict, status_code=200)
async def get_continue_watching(user=Depends(get_current_user), db=Depends(get_db)):
    """
    Return in-progress episodes for the authenticated user.

    Each item is enriched with the parent series and episode details.
    """
    progress_repo = ReadingProgressRepository(db)
    series_repo = SeriesRepository(db)
    ep_repo = EpisodeRepository(db)

    in_progress = await progress_repo.list_in_progress(user["id"])
    result = []
    for p in in_progress:
        series = await series_repo.find_by_id(p["series_id"])
        episode = await ep_repo.find_by_id(p["episode_id"])
        if series and episode:
            result.append({
                "series": series,
                "episode": episode,
                "progress": p["progress"],
                "updated_at": p["updated_at"],
            })
    return {"items": result}


# ---------------------------------------------------------------------------
# Watch history
# ---------------------------------------------------------------------------

@router.get("/history", response_model=dict, status_code=200)
async def get_history(user=Depends(get_current_user), db=Depends(get_db)):
    """Return the authenticated user's watch history."""
    repo = WatchHistoryRepository(db)
    items = await repo.list_for_user(user["id"])
    return {"items": items}


@router.post("/history", response_model=MessageResponse, status_code=200)
async def update_history(
    data: WatchHistoryUpdateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Add or update a watch history entry (upsert by anime_id + episode_number)."""
    repo = WatchHistoryRepository(db)
    doc = {
        "user_id": user["id"],
        "anime_id": data.anime_id,
        "episode_number": data.episode_number,
        "title": data.title,
        "anime_title": data.anime_title,
        "image_url": data.image_url,
        "progress": data.progress,
    }
    await repo.upsert(user["id"], doc)
    return MessageResponse(message="History updated.")


# ---------------------------------------------------------------------------
# Feed
# ---------------------------------------------------------------------------

@router.get("/feed/featured", response_model=dict, status_code=200)
async def get_featured(db=Depends(get_db)):
    """Return the top 5 most-liked series."""
    from backend.constants import COL_SERIES
    items = (
        await db[COL_SERIES].find({}, {"_id": 0})
        .sort("like_count", -1)
        .limit(5)
        .to_list(5)
    )
    return {"data": items}


@router.get("/feed/trending", response_model=dict, status_code=200)
async def get_trending(db=Depends(get_db)):
    """Return the top 20 most-viewed series."""
    from backend.constants import COL_SERIES
    items = (
        await db[COL_SERIES].find({}, {"_id": 0})
        .sort("view_count", -1)
        .limit(20)
        .to_list(20)
    )
    return {"data": items}


@router.get("/feed/latest", response_model=dict, status_code=200)
async def get_latest(db=Depends(get_db)):
    """Return the 20 most recently created series."""
    from backend.constants import COL_SERIES
    items = (
        await db[COL_SERIES].find({}, {"_id": 0})
        .sort("created_at", -1)
        .limit(20)
        .to_list(20)
    )
    return {"data": items}


@router.get("/feed/top-creators", response_model=dict, status_code=200)
async def get_top_creators(db=Depends(get_db)):
    """Return the top 10 creators by follower count."""
    user_repo = UserRepository(db)
    creators = await user_repo.list_creators(limit=10)
    return {"data": creators}


# ---------------------------------------------------------------------------
# Genres
# ---------------------------------------------------------------------------

@router.get("/genres", response_model=dict, status_code=200)
async def get_genres():
    """Return the list of available genres."""
    return {"genres": GENRES}


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

@router.post("/reports", response_model=dict, status_code=201)
async def create_report(
    data: ReportCreateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Submit a content report."""
    content = await _resolve_report_content(data.content_type, data.content_id, db)

    report_id = new_id()
    doc = {
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
        "created_at": utcnow_iso(),
    }
    report_repo = ReportRepository(db)
    await report_repo.create(doc)
    return {"message": "Report submitted successfully.", "report_id": report_id}


@router.get("/reports", response_model=dict, status_code=200)
async def get_reports(
    status: Optional[str] = None,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Return reports against the authenticated creator's content."""
    report_repo = ReportRepository(db)
    reports = await report_repo.list_for_creator(user["id"], status=status)
    return {"reports": reports}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _resolve_report_content(content_type: str, content_id: str, db) -> dict:
    from backend.constants import COL_EPISODES, COL_SERIES, COL_USERS

    if content_type == "series":
        doc = await db[COL_SERIES].find_one({"id": content_id}, {"_id": 0})
    elif content_type == "episode":
        doc = await db[COL_EPISODES].find_one({"id": content_id}, {"_id": 0})
    elif content_type == "user":
        doc = await db[COL_USERS].find_one({"id": content_id}, {"_id": 0, "password_hash": 0})
    else:
        raise BadRequestError("Invalid content type.")

    if not doc:
        raise NotFoundError("Content not found.")
    return doc
