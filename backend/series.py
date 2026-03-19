"""
Series routes.

Endpoints:
    POST   /api/v1/series
    GET    /api/v1/series
    GET    /api/v1/series/search
    GET    /api/v1/series/{series_id}
    PATCH  /api/v1/series/{series_id}
    DELETE /api/v1/series/{series_id}
    GET    /api/v1/series/{series_id}/episodes
    GET    /api/v1/my/series
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from backend.auth import get_current_user, optional_user
from backend.database import get_db
from backend.exceptions import CreatorRequiredError, OwnershipError, SeriesNotFoundError
from backend.models import EpisodeRepository, SeriesRepository
from backend.schemas import (
    MessageResponse,
    PaginatedSeriesResponse,
    SeriesCreateRequest,
    SeriesResponse,
    SeriesUpdateRequest,
)
from backend.utils import build_series_query, clamp_page_size, new_id, resolve_sort, utcnow_iso

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Series"])


@router.post("/series", response_model=SeriesResponse, status_code=201)
async def create_series(
    data: SeriesCreateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Create a new series.

    Requires the authenticated user to have creator status.
    """
    if not user.get("is_creator"):
        raise CreatorRequiredError()

    final_genre = (
        data.custom_genre
        if data.genre == "Custom" and data.custom_genre
        else data.genre
    )

    series_id = new_id()
    doc = {
        "id": series_id,
        "creator_id": user["id"],
        "creator_name": user["username"],
        "creator_avatar_color": user.get("avatar_color", "#00F0FF"),
        "title": data.title,
        "description": data.description,
        "genre": final_genre,
        "content_type": data.content_type,
        "tags": data.tags,
        "thumbnail_base64": data.thumbnail_base64,
        "cover_base64": data.cover_base64,
        "episode_count": 0,
        "view_count": 0,
        "like_count": 0,
        "subscriber_count": 0,
        "is_featured": False,
        "status": data.status,
        "created_at": utcnow_iso(),
        "updated_at": None,
    }
    repo = SeriesRepository(db)
    created = await repo.create(doc)
    logger.info("Series created: %s by %s", series_id, user["username"])
    return SeriesResponse(**created)


@router.get("/series", response_model=PaginatedSeriesResponse, status_code=200)
async def list_series(
    genre: Optional[str] = None,
    content_type: Optional[str] = None,
    status: Optional[str] = None,
    sort: str = Query("latest", enum=["latest", "popular", "liked"]),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_db),
):
    """
    List series with optional filtering and sorting.

    Supports pagination via `page` and `limit` query parameters.
    """
    limit = clamp_page_size(limit)
    skip = (page - 1) * limit
    query = build_series_query(genre=genre, content_type=content_type, status=status)
    sort_field, sort_dir = resolve_sort(sort)

    repo = SeriesRepository(db)
    items, total = await repo.list(query, sort_field, sort_dir, skip, limit)
    has_next = (skip + len(items)) < total

    return PaginatedSeriesResponse(
        data=[SeriesResponse(**s) for s in items],
        total=total,
        page=page,
        page_size=limit,
        has_next=has_next,
    )


@router.get("/series/search", response_model=dict, status_code=200)
async def search_series(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
    db=Depends(get_db),
):
    """Full-text search on series titles (case-insensitive)."""
    repo = SeriesRepository(db)
    items = await repo.search(q, limit=limit)
    return {"data": [SeriesResponse(**s) for s in items]}


@router.get("/series/{series_id}", response_model=SeriesResponse, status_code=200)
async def get_series(series_id: str, db=Depends(get_db)):
    """
    Retrieve a single series by ID.

    Increments the view counter on each call.
    """
    repo = SeriesRepository(db)
    series = await repo.find_by_id(series_id)
    if not series:
        raise SeriesNotFoundError()
    await repo.increment_view(series_id)
    series["view_count"] = series.get("view_count", 0) + 1
    return SeriesResponse(**series)


@router.patch("/series/{series_id}", response_model=SeriesResponse, status_code=200)
async def update_series(
    series_id: str,
    data: SeriesUpdateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Update mutable fields of a series owned by the authenticated creator."""
    repo = SeriesRepository(db)
    series = await repo.find_by_id_and_creator(series_id, user["id"])
    if not series:
        raise SeriesNotFoundError()

    updates = data.model_dump(exclude_none=True)
    if updates:
        await repo.update(series_id, updates)
        series.update(updates)

    return SeriesResponse(**series)


@router.delete("/series/{series_id}", response_model=MessageResponse, status_code=200)
async def delete_series(
    series_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Delete a series and all its episodes.

    Only the series creator may delete it.
    """
    series_repo = SeriesRepository(db)
    ep_repo = EpisodeRepository(db)

    series = await series_repo.find_by_id_and_creator(series_id, user["id"])
    if not series:
        raise SeriesNotFoundError()

    await series_repo.delete(series_id)
    await ep_repo.delete_by_series(series_id)
    logger.info("Series deleted: %s by %s", series_id, user["username"])
    return MessageResponse(message="Series deleted.")


@router.get("/series/{series_id}/episodes", response_model=dict, status_code=200)
async def get_series_episodes(series_id: str, db=Depends(get_db)):
    """List all episodes for a series, ordered by episode number."""
    series_repo = SeriesRepository(db)
    if not await series_repo.find_by_id(series_id):
        raise SeriesNotFoundError()

    ep_repo = EpisodeRepository(db)
    episodes = await ep_repo.list_by_series(series_id)
    return {"data": episodes}


@router.get("/my/series", response_model=dict, status_code=200)
async def my_series(user=Depends(get_current_user), db=Depends(get_db)):
    """Return all series created by the authenticated user (creator studio)."""
    repo = SeriesRepository(db)
    items = await repo.list_by_creator(user["id"])
    return {"data": [SeriesResponse(**s) for s in items]}
