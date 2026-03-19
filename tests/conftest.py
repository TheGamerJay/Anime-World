"""
Pytest fixtures for the Anime World API test suite.

Provides:
- Async test client backed by an in-process FastAPI app
- Isolated test database (separate DB name per test session)
- Authenticated client helpers
- Test data factories
"""

from __future__ import annotations

import asyncio
import os
import random
import string
from typing import AsyncGenerator, Dict, Generator, Tuple

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# ---------------------------------------------------------------------------
# Event loop policy (required for pytest-asyncio with motor)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop_policy():
    return asyncio.DefaultEventLoopPolicy()


# ---------------------------------------------------------------------------
# App fixture — spins up the FastAPI app with a test database
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(scope="session")
async def app():
    """
    Create the FastAPI application wired to a dedicated test database.

    The test DB is dropped after the session completes.
    """
    # Point at a test-specific database so we never touch production data
    test_db_name = f"anime_world_test_{_random_suffix()}"
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ["DB_NAME"] = test_db_name
    os.environ.setdefault("JWT_SECRET", "test-secret-key-not-for-production")
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault("LOG_LEVEL", "WARNING")

    # Import after env vars are set so config picks them up
    from backend.config import get_settings
    get_settings.cache_clear()

    from backend.server import app as fastapi_app
    from backend.database import db_manager

    await db_manager.connect()
    yield fastapi_app

    # Teardown: drop the test database
    try:
        await db_manager._client.drop_database(test_db_name)  # type: ignore[union-attr]
    except Exception:
        pass
    await db_manager.disconnect()


@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated async HTTP client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# User / auth fixtures
# ---------------------------------------------------------------------------

def _random_suffix(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


@pytest.fixture
def test_user_credentials() -> Dict[str, str]:
    """Fresh credentials for each test — avoids duplicate-email conflicts."""
    suffix = _random_suffix()
    return {
        "username": f"testuser_{suffix}",
        "email": f"test_{suffix}@example.com",
        "password": "TestPass1",
    }


@pytest.fixture
def creator_credentials() -> Dict[str, str]:
    suffix = _random_suffix()
    return {
        "username": f"creator_{suffix}",
        "email": f"creator_{suffix}@example.com",
        "password": "CreatorPass1",
    }


@pytest_asyncio.fixture
async def registered_user(client: AsyncClient, test_user_credentials) -> Dict:
    """Register a user and return the full auth response dict."""
    resp = await client.post("/api/auth/register", json=test_user_credentials)
    assert resp.status_code == 200, f"Registration failed: {resp.text}"
    return resp.json()


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient, registered_user) -> AsyncClient:
    """Async client pre-configured with a valid Bearer token."""
    token = registered_user["token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest_asyncio.fixture
async def creator_client(client: AsyncClient, creator_credentials) -> Tuple[AsyncClient, Dict]:
    """
    Async client authenticated as a creator.

    Returns (client, user_data) so tests can access the creator's ID.
    """
    # Register
    resp = await client.post("/api/auth/register", json=creator_credentials)
    assert resp.status_code == 200
    data = resp.json()
    token = data["token"]
    client.headers.update({"Authorization": f"Bearer {token}"})

    # Upgrade to creator
    upgrade = await client.put("/api/auth/become-creator")
    assert upgrade.status_code == 200

    return client, data["user"]


# ---------------------------------------------------------------------------
# Data factories
# ---------------------------------------------------------------------------

def make_series_payload(**overrides) -> Dict:
    """Return a minimal valid series creation payload."""
    return {
        "title": f"Test Series {_random_suffix()}",
        "description": "A test series description.",
        "genre": "Action",
        "content_type": "series",
        "tags": ["test"],
        **overrides,
    }


def make_episode_payload(series_id: str, episode_number: int = 1, **overrides) -> Dict:
    """Return a minimal valid episode creation payload."""
    return {
        "series_id": series_id,
        "title": f"Episode {episode_number}",
        "description": "Test episode.",
        "episode_number": episode_number,
        "video_url": "https://example.com/video.mp4",
        "is_premium": False,
        **overrides,
    }


def make_comment_payload(content_type: str, content_id: str, **overrides) -> Dict:
    return {
        "content_type": content_type,
        "content_id": content_id,
        "text": f"Test comment {_random_suffix()}",
        **overrides,
    }
