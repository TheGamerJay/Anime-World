"""
Comment routes.

Endpoints:
    POST   /api/v1/comments
    GET    /api/v1/comments/{content_type}/{content_id}
    DELETE /api/v1/comments/{comment_id}
    POST   /api/v1/comments/{comment_id}/like
"""

import logging

from fastapi import APIRouter, Depends, Query

from backend.auth import get_current_user
from backend.constants import NOTIF_TYPE_COMMENT, VALID_COMMENT_CONTENT_TYPES
from backend.database import get_db
from backend.exceptions import (
    CommentNotFoundError,
    ForbiddenError,
    InvalidContentTypeError,
    NotFoundError,
)
from backend.models import (
    CommentLikeRepository,
    CommentRepository,
    EpisodeRepository,
    NotificationRepository,
    SeriesRepository,
)
from backend.schemas import (
    CommentCreateRequest,
    CommentResponse,
    MessageResponse,
    PaginatedCommentsResponse,
)
from backend.utils import new_id, utcnow_iso

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Comments"])


@router.post("/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    data: CommentCreateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Post a comment (or reply) on a series or episode.

    Sends a notification to the content owner when a new top-level
    comment is posted (replies do not trigger a notification).
    """
    content, owner_id = await _resolve_content(data.content_type, data.content_id, db)

    comment_id = new_id()
    doc = {
        "id": comment_id,
        "content_type": data.content_type,
        "content_id": data.content_id,
        "user_id": user["id"],
        "username": user["username"],
        "avatar_color": user.get("avatar_color", "#00F0FF"),
        "text": data.text,
        "parent_id": data.parent_id,
        "like_count": 0,
        "created_at": utcnow_iso(),
    }

    comment_repo = CommentRepository(db)
    created = await comment_repo.create(doc)

    # Notify content owner (only for top-level comments, not replies)
    if not data.parent_id and owner_id and owner_id != user["id"]:
        notif_repo = NotificationRepository(db)
        await notif_repo.create(
            owner_id,
            NOTIF_TYPE_COMMENT,
            f"{user['username']} commented on your content",
            related_id=data.content_id,
        )

    logger.info("Comment created: %s on %s/%s", comment_id, data.content_type, data.content_id)
    return CommentResponse(**{**created, "replies": [], "reply_count": 0})


@router.get(
    "/comments/{content_type}/{content_id}",
    response_model=PaginatedCommentsResponse,
    status_code=200,
)
async def get_comments(
    content_type: str,
    content_id: str,
    page: int = Query(1, ge=1),
    db=Depends(get_db),
):
    """
    List top-level comments for a piece of content, with nested replies.

    Returns 20 comments per page, each with up to 5 inline replies.
    """
    if content_type not in VALID_COMMENT_CONTENT_TYPES:
        raise InvalidContentTypeError(
            f"content_type must be one of {VALID_COMMENT_CONTENT_TYPES}"
        )

    skip = (page - 1) * 20
    comment_repo = CommentRepository(db)
    comments, total = await comment_repo.list_top_level(content_type, content_id, skip, 20)

    # Enrich each comment with its replies
    enriched = []
    for c in comments:
        replies = await comment_repo.list_replies(c["id"], limit=5)
        reply_count = await comment_repo.count_replies(c["id"])
        enriched.append(
            CommentResponse(
                **c,
                replies=[CommentResponse(**r, replies=[], reply_count=0) for r in replies],
                reply_count=reply_count,
            )
        )

    return PaginatedCommentsResponse(comments=enriched, total=total, page=page)


@router.delete("/comments/{comment_id}", response_model=MessageResponse, status_code=200)
async def delete_comment(
    comment_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Delete a comment and all its replies.

    Only the comment author may delete their own comment.
    """
    comment_repo = CommentRepository(db)
    comment = await comment_repo.find_by_id(comment_id)
    if not comment:
        raise CommentNotFoundError()
    if comment["user_id"] != user["id"]:
        raise ForbiddenError("You can only delete your own comments.")

    await comment_repo.delete(comment_id)
    await comment_repo.delete_replies(comment_id)
    return MessageResponse(message="Comment deleted.")


@router.post("/comments/{comment_id}/like", response_model=dict, status_code=200)
async def like_comment(
    comment_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Toggle a like on a comment. Returns the new liked state."""
    comment_repo = CommentRepository(db)
    like_repo = CommentLikeRepository(db)

    comment = await comment_repo.find_by_id(comment_id)
    if not comment:
        raise CommentNotFoundError()

    if await like_repo.exists(comment_id, user["id"]):
        await like_repo.delete(comment_id, user["id"])
        await comment_repo.increment_like(comment_id, -1)
        return {"liked": False}

    await like_repo.create(comment_id, user["id"])
    await comment_repo.increment_like(comment_id, 1)
    return {"liked": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _resolve_content(content_type: str, content_id: str, db):
    """
    Fetch the content document and return (doc, owner_id).

    Raises NotFoundError if the content does not exist.
    """
    if content_type == "series":
        repo = SeriesRepository(db)
        doc = await repo.find_by_id(content_id)
        owner_id = doc.get("creator_id") if doc else None
    elif content_type == "episode":
        repo = EpisodeRepository(db)
        doc = await repo.find_by_id(content_id)
        owner_id = doc.get("creator_id") if doc else None
    else:
        raise InvalidContentTypeError()

    if not doc:
        raise NotFoundError("Content not found.")

    return doc, owner_id
