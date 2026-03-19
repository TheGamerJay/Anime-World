"""
Episode routes.

Endpoints:
    POST   /api/v1/episodes
    GET    /api/v1/episodes/{episode_id}
    DELETE /api/v1/episodes/{episode_id}
"""

import logging

from fastapi import APIRouter, Depends

from backend.auth import get_current_user
from backend.database import get_db
from backend.exceptions import EpisodeNotFoundError, SeriesNotFoundError
from backend.models import EpisodeRepository, NotificationRepository, SeriesRepository
from backend.schemas import EpisodeCreateRequest, EpisodeResponse, MessageResponse
from backend.constants import NOTIF_TYPE_NEW_EPISODE
from backend.utils import new_id, utcnow_iso

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Episodes"])


@router.post("/episodes", response_model=EpisodeResponse, status_code=201)
async def create_episode(
    data: EpisodeCreateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Add a new episode to a series.

    The authenticated user must be the series creator.
    Notifies all followers of the series creator about the new episode.
    """
    series_repo = SeriesRepository(db)
    series = await series_repo.find_by_id_and_creator(data.series_id, user["id"])
    if not series:
        raise SeriesNotFoundError()

    ep_id = new_id()
    doc = {
        "id": ep_id,
        "series_id": data.series_id,
        "creator_id": user["id"],
        "title": data.title,
        "description": data.description or "",
        "episode_number": data.episode_number,
        "video_url": data.video_url or "",
        "content_text": data.content_text or "",
        "arc_name": data.arc_name,
        "thumbnail_base64": data.thumbnail_base64 or series.get("thumbnail_base64"),
        "is_premium": data.is_premium,
        "view_count": 0,
        "like_count": 0,
        "created_at": utcnow_iso(),
    }

    ep_repo = EpisodeRepository(db)
    created = await ep_repo.create(doc)
    await series_repo.increment(data.series_id, {"episode_count": 1})

    # Notify followers about the new episode
    notif_repo = NotificationRepository(db)
    await _notify_followers(db, user["id"], series["title"], data.title, ep_id, notif_repo)

    logger.info(
        "Episode created: %s (ep %d) for series %s",
        ep_id,
        data.episode_number,
        data.series_id,
    )
    return EpisodeResponse(**created)


@router.get("/episodes/{episode_id}", response_model=EpisodeResponse, status_code=200)
async def get_episode(episode_id: str, db=Depends(get_db)):
    """
    Retrieve a single episode by ID.

    Increments both the episode and series view counters.
    """
    ep_repo = EpisodeRepository(db)
    ep = await ep_repo.find_by_id(episode_id)
    if not ep:
        raise EpisodeNotFoundError()

    await ep_repo.increment_view(episode_id)
    series_repo = SeriesRepository(db)
    await series_repo.increment(ep["series_id"], {"view_count": 1})

    ep["view_count"] = ep.get("view_count", 0) + 1
    return EpisodeResponse(**ep)


@router.delete("/episodes/{episode_id}", response_model=MessageResponse, status_code=200)
async def delete_episode(
    episode_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Delete an episode.

    Only the episode creator may delete it. Decrements the parent
    series episode count.
    """
    ep_repo = EpisodeRepository(db)
    ep = await ep_repo.find_by_id_and_creator(episode_id, user["id"])
    if not ep:
        raise EpisodeNotFoundError()

    await ep_repo.delete(episode_id)
    series_repo = SeriesRepository(db)
    await series_repo.increment(ep["series_id"], {"episode_count": -1})

    logger.info("Episode deleted: %s by %s", episode_id, user["username"])
    return MessageResponse(message="Episode deleted.")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _notify_followers(
    db,
    creator_id: str,
    series_title: str,
    episode_title: str,
    episode_id: str,
    notif_repo: NotificationRepository,
) -> None:
    """Send a new-episode notification to all followers of the creator."""
    from backend.constants import COL_FOLLOWS

    follows = await db[COL_FOLLOWS].find(
        {"following_id": creator_id}, {"_id": 0}
    ).to_list(1000)

    message = f"New episode '{episode_title}' added to '{series_title}'"
    for follow in follows:
        await notif_repo.create(
            follow["follower_id"],
            NOTIF_TYPE_NEW_EPISODE,
            message,
            related_id=episode_id,
        )
