"""
Profile and sub-profile routes.

Endpoints:
    GET    /api/v1/profile
    PUT    /api/v1/profile
    POST   /api/v1/profile/avatar
    DELETE /api/v1/profile/avatar
    GET    /api/v1/profiles
    POST   /api/v1/profiles
    PUT    /api/v1/profiles/{profile_id}/switch
    DELETE /api/v1/profiles/{profile_id}
    GET    /api/v1/creators/{user_id}
    POST   /api/v1/follow/{creator_id}
    DELETE /api/v1/follow/{creator_id}
    GET    /api/v1/follow/check/{creator_id}
"""

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse

from backend.auth import get_current_user
from backend.config import get_settings
from backend.constants import (
    ALLOWED_AVATAR_MIME_TYPES,
    DEFAULT_AVATAR_COLOR,
    MAX_PROFILES_PER_USER,
    NOTIF_TYPE_FOLLOW,
)
from backend.database import get_db
from backend.exceptions import (
    BadRequestError,
    FileTooLargeError,
    ForbiddenError,
    LimitExceededError,
    NotFoundError,
    UnsupportedMediaTypeError,
    UserNotFoundError,
)
from backend.models import (
    FollowRepository,
    NotificationRepository,
    ProfileRepository,
    SeriesRepository,
    UserRepository,
)
from backend.schemas import (
    MessageResponse,
    ProfileUpdateRequest,
    SubProfileCreateRequest,
    UserResponse,
)
from backend.utils import new_id, safe_user, utcnow_iso

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Profiles"])


# ---------------------------------------------------------------------------
# Main user profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=UserResponse, status_code=200)
async def get_profile(user=Depends(get_current_user)):
    """Return the authenticated user's own profile."""
    return UserResponse(**safe_user(user))


@router.put("/profile", response_model=UserResponse, status_code=200)
async def update_profile(
    data: ProfileUpdateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Update bio, avatar colour, or avatar URL for the authenticated user."""
    updates = {}
    if data.bio is not None:
        updates["bio"] = data.bio[:500]
    if data.avatar_color is not None:
        updates["avatar_color"] = data.avatar_color
    if data.avatar_url is not None:
        updates["avatar_url"] = data.avatar_url
    if data.avatar_type is not None:
        updates["avatar_type"] = data.avatar_type

    user_repo = UserRepository(db)
    if updates:
        await user_repo.update(user["id"], updates)

    updated = await user_repo.safe_find_by_id(user["id"])
    return UserResponse(**updated)


@router.post("/profile/avatar", response_model=dict, status_code=200)
async def upload_avatar(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Upload a profile picture (image, GIF, or short video).

    Maximum file size is controlled by MAX_AVATAR_SIZE_MB in config.
    """
    settings = get_settings()
    content_type = file.content_type or ""

    if content_type not in ALLOWED_AVATAR_MIME_TYPES:
        raise UnsupportedMediaTypeError(
            f"Unsupported file type: {content_type}. "
            f"Allowed: {', '.join(ALLOWED_AVATAR_MIME_TYPES.keys())}"
        )

    avatar_type, extension = ALLOWED_AVATAR_MIME_TYPES[content_type]
    contents = await file.read()

    if len(contents) > settings.max_avatar_size_bytes:
        raise FileTooLargeError(
            f"File too large. Maximum size is {settings.MAX_AVATAR_SIZE_MB} MB."
        )

    upload_dir: Path = settings.UPLOAD_DIR / "avatars"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Remove old avatar file if stored locally
    old_avatar = user.get("avatar_url", "")
    if old_avatar and old_avatar.startswith("/api/v1/uploads/avatars/"):
        old_path = upload_dir / old_avatar.split("/")[-1]
        if old_path.exists():
            old_path.unlink(missing_ok=True)

    file_id = new_id()
    filename = f"{user['id']}_{file_id}{extension}"
    file_path = upload_dir / filename
    file_path.write_bytes(contents)

    avatar_url = f"/api/v1/uploads/avatars/{filename}"
    user_repo = UserRepository(db)
    await user_repo.update(user["id"], {"avatar_url": avatar_url, "avatar_type": avatar_type})

    updated = await user_repo.safe_find_by_id(user["id"])
    return {
        "message": "Avatar uploaded successfully.",
        "avatar_url": avatar_url,
        "avatar_type": avatar_type,
        "user": UserResponse(**updated),
    }


@router.delete("/profile/avatar", response_model=MessageResponse, status_code=200)
async def delete_avatar(user=Depends(get_current_user), db=Depends(get_db)):
    """Remove the authenticated user's profile picture."""
    settings = get_settings()
    old_avatar = user.get("avatar_url", "")
    if old_avatar and old_avatar.startswith("/api/v1/uploads/avatars/"):
        upload_dir = settings.UPLOAD_DIR / "avatars"
        old_path = upload_dir / old_avatar.split("/")[-1]
        old_path.unlink(missing_ok=True)

    user_repo = UserRepository(db)
    await user_repo.update(user["id"], {"avatar_url": None, "avatar_type": None})
    return MessageResponse(message="Avatar removed.")


@router.get("/uploads/avatars/{filename}", status_code=200)
async def get_avatar_file(filename: str):
    """Serve an uploaded avatar file."""
    settings = get_settings()
    file_path = settings.UPLOAD_DIR / "avatars" / filename
    if not file_path.exists():
        raise NotFoundError("File not found.")

    ext = file_path.suffix.lower()
    media_types = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".webp": "image/webp",
        ".gif": "image/gif", ".mp4": "video/mp4",
        ".mov": "video/quicktime", ".webm": "video/webm",
    }
    return FileResponse(str(file_path), media_type=media_types.get(ext, "application/octet-stream"))


# ---------------------------------------------------------------------------
# Sub-profiles (Netflix-style)
# ---------------------------------------------------------------------------

@router.get("/profiles", response_model=dict, status_code=200)
async def list_profiles(user=Depends(get_current_user), db=Depends(get_db)):
    """
    List all sub-profiles for the authenticated user.

    Creates a default profile if none exist yet.
    """
    repo = ProfileRepository(db)
    profiles = await repo.list_for_user(user["id"])

    if not profiles:
        default = await _create_default_profile(user, repo)
        profiles = [default]

    return {"profiles": profiles}


@router.post("/profiles", response_model=dict, status_code=201)
async def create_profile(
    data: SubProfileCreateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Create a new sub-profile.

    Users are limited to MAX_PROFILES_PER_USER profiles.
    """
    repo = ProfileRepository(db)
    count = await repo.count_for_user(user["id"])
    if count >= MAX_PROFILES_PER_USER:
        raise LimitExceededError(
            f"Maximum of {MAX_PROFILES_PER_USER} profiles allowed."
        )

    doc = {
        "id": new_id(),
        "user_id": user["id"],
        "name": data.name,
        "avatar_color": data.avatar_color,
        "is_active": False,
        "created_at": utcnow_iso(),
    }
    return await repo.create(doc)


@router.put("/profiles/{profile_id}/switch", response_model=dict, status_code=200)
async def switch_profile(
    profile_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Activate a sub-profile (deactivates all others for this user)."""
    repo = ProfileRepository(db)
    profile = await repo.find_by_id_and_user(profile_id, user["id"])
    if not profile:
        raise NotFoundError("Profile not found.")

    await repo.set_active(user["id"], profile_id)
    profile["is_active"] = True
    return {"message": "Profile switched.", "profile": profile}


@router.delete("/profiles/{profile_id}", response_model=MessageResponse, status_code=200)
async def delete_profile(
    profile_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Delete a sub-profile.

    The last remaining profile cannot be deleted.
    """
    repo = ProfileRepository(db)
    profile = await repo.find_by_id_and_user(profile_id, user["id"])
    if not profile:
        raise NotFoundError("Profile not found.")

    count = await repo.count_for_user(user["id"])
    if count <= 1:
        raise BadRequestError("Cannot delete your only profile.")

    await repo.delete(profile_id)
    return MessageResponse(message="Profile deleted.")


# ---------------------------------------------------------------------------
# Creator profile (public)
# ---------------------------------------------------------------------------

@router.get("/creators/{user_id}", response_model=dict, status_code=200)
async def get_creator_profile(user_id: str, db=Depends(get_db)):
    """Return a creator's public profile and their series list."""
    user_repo = UserRepository(db)
    creator = await user_repo.safe_find_by_id(user_id)
    if not creator:
        raise UserNotFoundError()

    series_repo = SeriesRepository(db)
    series_list = await series_repo.list_by_creator(user_id)
    return {"creator": UserResponse(**creator), "series": series_list}


# ---------------------------------------------------------------------------
# Follow system
# ---------------------------------------------------------------------------

@router.post("/follow/{creator_id}", response_model=MessageResponse, status_code=200)
async def follow_creator(
    creator_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Follow a creator. Raises 400 if already following or self-follow."""
    if creator_id == user["id"]:
        raise BadRequestError("Cannot follow yourself.")

    follow_repo = FollowRepository(db)
    if await follow_repo.exists(user["id"], creator_id):
        raise BadRequestError("Already following this creator.")

    await follow_repo.create(user["id"], creator_id)

    user_repo = UserRepository(db)
    await user_repo.increment(creator_id, {"follower_count": 1})
    await user_repo.increment(user["id"], {"following_count": 1})

    notif_repo = NotificationRepository(db)
    await notif_repo.create(
        creator_id,
        NOTIF_TYPE_FOLLOW,
        f"{user['username']} started following you",
        related_id=user["id"],
    )
    return MessageResponse(message="Followed.")


@router.delete("/follow/{creator_id}", response_model=MessageResponse, status_code=200)
async def unfollow_creator(
    creator_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Unfollow a creator."""
    follow_repo = FollowRepository(db)
    deleted = await follow_repo.delete(user["id"], creator_id)
    if not deleted:
        raise NotFoundError("Not following this creator.")

    user_repo = UserRepository(db)
    await user_repo.increment(creator_id, {"follower_count": -1})
    await user_repo.increment(user["id"], {"following_count": -1})
    return MessageResponse(message="Unfollowed.")


@router.get("/follow/check/{creator_id}", response_model=dict, status_code=200)
async def check_follow(
    creator_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Check whether the authenticated user follows a given creator."""
    follow_repo = FollowRepository(db)
    is_following = await follow_repo.exists(user["id"], creator_id)
    return {"is_following": is_following}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _create_default_profile(user: dict, repo: ProfileRepository) -> dict:
    doc = {
        "id": new_id(),
        "user_id": user["id"],
        "name": user["username"],
        "avatar_color": user.get("avatar_color", DEFAULT_AVATAR_COLOR),
        "is_active": True,
        "created_at": utcnow_iso(),
    }
    return await repo.create(doc)
