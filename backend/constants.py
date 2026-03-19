"""
Application-wide constants and magic values.

All hardcoded strings and numbers live here so they can be referenced
by name rather than scattered as literals throughout the codebase.
"""

from typing import Dict, List, Tuple

# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRATION_HOURS: int = 72
JWT_REFRESH_EXPIRATION_DAYS: int = 30

# ---------------------------------------------------------------------------
# Password policy
# ---------------------------------------------------------------------------
PASSWORD_MIN_LENGTH: int = 8
PASSWORD_MAX_LENGTH: int = 128
MAX_LOGIN_ATTEMPTS: int = 5
LOCKOUT_DURATION_MINUTES: int = 15

# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------
DEFAULT_PAGE_SIZE: int = 20
MAX_PAGE_SIZE: int = 100
DEFAULT_FEED_LIMIT: int = 20
MAX_FEED_LIMIT: int = 50
MAX_EPISODES_PER_SERIES: int = 500
MAX_COMMENTS_PER_PAGE: int = 20
MAX_REPLIES_PER_COMMENT: int = 5
MAX_NOTIFICATIONS_RETURNED: int = 50
MAX_CONTINUE_WATCHING: int = 10
MAX_WATCHLIST_ITEMS: int = 500
MAX_CREATOR_SERIES: int = 200

# ---------------------------------------------------------------------------
# Content limits
# ---------------------------------------------------------------------------
MAX_BIO_LENGTH: int = 500
MAX_TITLE_LENGTH: int = 200
MAX_DESCRIPTION_LENGTH: int = 5000
MAX_COMMENT_LENGTH: int = 2000
MAX_TAGS: int = 10
MAX_TAG_LENGTH: int = 50
MAX_PROFILES_PER_USER: int = 5

# ---------------------------------------------------------------------------
# File upload
# ---------------------------------------------------------------------------
MAX_AVATAR_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB
ALLOWED_AVATAR_MIME_TYPES: Dict[str, Tuple[str, str]] = {
    "image/jpeg": ("image", ".jpg"),
    "image/png": ("image", ".png"),
    "image/webp": ("image", ".webp"),
    "image/gif": ("gif", ".gif"),
    "video/mp4": ("video", ".mp4"),
    "video/quicktime": ("video", ".mov"),
    "video/webm": ("video", ".webm"),
}

# ---------------------------------------------------------------------------
# Content types
# ---------------------------------------------------------------------------
VALID_CONTENT_TYPES: List[str] = ["series", "novel", "movie"]
VALID_REPORT_CONTENT_TYPES: List[str] = ["series", "episode", "user"]
VALID_COMMENT_CONTENT_TYPES: List[str] = ["series", "episode"]
VALID_REPORT_REASONS: List[str] = [
    "copyright", "inappropriate", "spam", "harassment", "other"
]
VALID_SERIES_STATUSES: List[str] = ["ongoing", "completed", "hiatus", "cancelled"]
VALID_SORT_OPTIONS: List[str] = ["latest", "popular", "liked"]

# ---------------------------------------------------------------------------
# Notification types
# ---------------------------------------------------------------------------
NOTIF_TYPE_COMMENT: str = "comment"
NOTIF_TYPE_FOLLOW: str = "follow"
NOTIF_TYPE_TIP: str = "tip"
NOTIF_TYPE_NEW_EPISODE: str = "new_episode"
NOTIF_TYPE_LIKE: str = "like"

# ---------------------------------------------------------------------------
# Genres
# ---------------------------------------------------------------------------
GENRES: List[str] = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
    "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
    "Mystery", "Mecha", "Isekai", "Thriller",
]

# ---------------------------------------------------------------------------
# Sort field mapping
# ---------------------------------------------------------------------------
SORT_FIELD_MAP: Dict[str, Tuple[str, int]] = {
    "latest": ("created_at", -1),
    "popular": ("view_count", -1),
    "liked": ("like_count", -1),
}

# ---------------------------------------------------------------------------
# Default values
# ---------------------------------------------------------------------------
DEFAULT_AVATAR_COLOR: str = "#00F0FF"
DEFAULT_SERIES_STATUS: str = "ongoing"
DEFAULT_CONTENT_TYPE: str = "series"

# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------
PASSWORD_RESET_EXPIRY_HOURS: int = 24

# ---------------------------------------------------------------------------
# Database collection names
# ---------------------------------------------------------------------------
COL_USERS: str = "users"
COL_SERIES: str = "series"
COL_EPISODES: str = "series_episodes"
COL_COMMENTS: str = "comments"
COL_COMMENT_LIKES: str = "comment_likes"
COL_NOTIFICATIONS: str = "notifications"
COL_REPORTS: str = "reports"
COL_FOLLOWS: str = "follows"
COL_WATCHLIST: str = "watchlist"
COL_LIKES: str = "likes"
COL_READING_PROGRESS: str = "reading_progress"
COL_PASSWORD_RESETS: str = "password_resets"
COL_PROFILES: str = "profiles"
COL_HISTORY: str = "watch_history"
COL_REFRESH_TOKENS: str = "refresh_tokens"
COL_AUDIT_LOG: str = "audit_log"
