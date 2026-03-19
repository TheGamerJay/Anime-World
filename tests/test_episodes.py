"""
Integration tests for episode endpoints.

Tests cover:
- Creating episodes (creator only, must own series)
- Getting an episode (view count increment)
- Deleting an episode
- Episode count on parent series
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.conftest import make_episode_payload, make_series_payload

pytestmark = pytest.mark.anyio


@pytest_asyncio.fixture
async def series_with_creator(creator_client):
    """Create a series and return (client, creator, series_id)."""
    client, creator = creator_client
    resp = await client.post("/api/v1/series", json=make_series_payload())
    assert resp.status_code == 201
    return client, creator, resp.json()["id"]


class TestCreateEpisode:
    async def test_create_episode_success(self, series_with_creator):
        client, creator, series_id = series_with_creator
        payload = make_episode_payload(series_id)
        resp = await client.post("/api/v1/episodes", json=payload)
        assert resp.status_code == 201, resp.text

        data = resp.json()
        assert data["series_id"] == series_id
        assert data["episode_number"] == 1
        assert data["creator_id"] == creator["id"]

    async def test_create_episode_increments_series_count(self, series_with_creator, client: AsyncClient):
        c, _, series_id = series_with_creator
        await c.post("/api/v1/episodes", json=make_episode_payload(series_id, 1))
        await c.post("/api/v1/episodes", json=make_episode_payload(series_id, 2))

        series_resp = await client.get(f"/api/v1/series/{series_id}")
        assert series_resp.json()["episode_count"] >= 2

    async def test_create_episode_requires_series_ownership(self, series_with_creator, auth_client: AsyncClient):
        _, _, series_id = series_with_creator
        payload = make_episode_payload(series_id)
        resp = await auth_client.post("/api/v1/episodes", json=payload)
        assert resp.status_code == 404  # Series not found for this creator

    async def test_create_episode_requires_auth(self, series_with_creator, client: AsyncClient):
        _, _, series_id = series_with_creator
        resp = await client.post("/api/v1/episodes", json=make_episode_payload(series_id))
        assert resp.status_code == 401

    async def test_create_episode_validates_episode_number(self, series_with_creator):
        client, _, series_id = series_with_creator
        payload = make_episode_payload(series_id, episode_number=0)  # must be >= 1
        resp = await client.post("/api/v1/episodes", json=payload)
        assert resp.status_code == 422

    async def test_create_episode_nonexistent_series(self, creator_client):
        client, _ = creator_client
        payload = make_episode_payload("nonexistent-series-id")
        resp = await client.post("/api/v1/episodes", json=payload)
        assert resp.status_code == 404


class TestGetEpisode:
    async def test_get_episode_success(self, series_with_creator, client: AsyncClient):
        c, _, series_id = series_with_creator
        create_resp = await c.post("/api/v1/episodes", json=make_episode_payload(series_id))
        ep_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/episodes/{ep_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == ep_id

    async def test_get_episode_increments_view_count(self, series_with_creator, client: AsyncClient):
        c, _, series_id = series_with_creator
        create_resp = await c.post("/api/v1/episodes", json=make_episode_payload(series_id))
        ep_id = create_resp.json()["id"]

        r1 = await client.get(f"/api/v1/episodes/{ep_id}")
        r2 = await client.get(f"/api/v1/episodes/{ep_id}")
        assert r2.json()["view_count"] >= r1.json()["view_count"]

    async def test_get_nonexistent_episode(self, client: AsyncClient):
        resp = await client.get("/api/v1/episodes/nonexistent-ep-id")
        assert resp.status_code == 404


class TestDeleteEpisode:
    async def test_delete_episode_success(self, series_with_creator, client: AsyncClient):
        c, _, series_id = series_with_creator
        create_resp = await c.post("/api/v1/episodes", json=make_episode_payload(series_id))
        ep_id = create_resp.json()["id"]

        del_resp = await c.delete(f"/api/v1/episodes/{ep_id}")
        assert del_resp.status_code == 200

        get_resp = await client.get(f"/api/v1/episodes/{ep_id}")
        assert get_resp.status_code == 404

    async def test_delete_episode_decrements_series_count(self, series_with_creator, client: AsyncClient):
        c, _, series_id = series_with_creator
        create_resp = await c.post("/api/v1/episodes", json=make_episode_payload(series_id))
        ep_id = create_resp.json()["id"]

        before = (await client.get(f"/api/v1/series/{series_id}")).json()["episode_count"]
        await c.delete(f"/api/v1/episodes/{ep_id}")
        after = (await client.get(f"/api/v1/series/{series_id}")).json()["episode_count"]
        assert after == before - 1

    async def test_delete_episode_not_owner(self, series_with_creator, auth_client: AsyncClient):
        c, _, series_id = series_with_creator
        create_resp = await c.post("/api/v1/episodes", json=make_episode_payload(series_id))
        ep_id = create_resp.json()["id"]

        resp = await auth_client.delete(f"/api/v1/episodes/{ep_id}")
        assert resp.status_code == 404


class TestSeriesEpisodesList:
    async def test_list_episodes_for_series(self, series_with_creator, client: AsyncClient):
        c, _, series_id = series_with_creator
        for i in range(1, 4):
            await c.post("/api/v1/episodes", json=make_episode_payload(series_id, i))

        resp = await client.get(f"/api/v1/series/{series_id}/episodes")
        assert resp.status_code == 200
        episodes = resp.json()["data"]
        assert len(episodes) >= 3
        # Should be ordered by episode_number ascending
        numbers = [e["episode_number"] for e in episodes]
        assert numbers == sorted(numbers)
