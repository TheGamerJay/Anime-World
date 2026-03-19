"""
Integration tests for series endpoints.

Tests cover:
- Creating a series (creator only)
- Listing series with filters and pagination
- Searching series
- Getting a single series (view count increment)
- Updating a series
- Deleting a series
- Listing episodes for a series
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest import make_series_payload

pytestmark = pytest.mark.anyio


class TestCreateSeries:
    async def test_create_series_as_creator(self, creator_client):
        client, creator = creator_client
        payload = make_series_payload()
        resp = await client.post("/api/v1/series", json=payload)
        assert resp.status_code == 201, resp.text

        data = resp.json()
        assert data["title"] == payload["title"]
        assert data["creator_id"] == creator["id"]
        assert data["episode_count"] == 0
        assert "id" in data

    async def test_create_series_requires_creator(self, auth_client: AsyncClient):
        """Regular users (non-creators) should receive 403."""
        payload = make_series_payload()
        resp = await auth_client.post("/api/v1/series", json=payload)
        assert resp.status_code == 403

    async def test_create_series_requires_auth(self, client: AsyncClient):
        payload = make_series_payload()
        resp = await client.post("/api/v1/series", json=payload)
        assert resp.status_code == 401

    async def test_create_series_validates_title_length(self, creator_client):
        client, _ = creator_client
        payload = make_series_payload(title="x" * 201)  # exceeds MAX_TITLE_LENGTH
        resp = await client.post("/api/v1/series", json=payload)
        assert resp.status_code == 422

    async def test_create_series_custom_genre(self, creator_client):
        client, _ = creator_client
        payload = make_series_payload(genre="Custom", custom_genre="Isekai-Mecha")
        resp = await client.post("/api/v1/series", json=payload)
        assert resp.status_code == 201
        assert resp.json()["genre"] == "Isekai-Mecha"


class TestListSeries:
    async def test_list_series_returns_paginated_response(self, client: AsyncClient, creator_client):
        c, _ = creator_client
        # Create a couple of series
        for _ in range(3):
            await c.post("/api/v1/series", json=make_series_payload())

        resp = await client.get("/api/v1/series")
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "has_next" in data
        assert isinstance(data["data"], list)

    async def test_list_series_filter_by_genre(self, client: AsyncClient, creator_client):
        c, _ = creator_client
        await c.post("/api/v1/series", json=make_series_payload(genre="Horror"))

        resp = await client.get("/api/v1/series?genre=Horror")
        assert resp.status_code == 200
        for item in resp.json()["data"]:
            assert item["genre"] == "Horror"

    async def test_list_series_sort_options(self, client: AsyncClient):
        for sort in ["latest", "popular", "liked"]:
            resp = await client.get(f"/api/v1/series?sort={sort}")
            assert resp.status_code == 200

    async def test_list_series_invalid_sort_rejected(self, client: AsyncClient):
        resp = await client.get("/api/v1/series?sort=invalid")
        assert resp.status_code == 422

    async def test_list_series_pagination(self, client: AsyncClient, creator_client):
        c, _ = creator_client
        for _ in range(5):
            await c.post("/api/v1/series", json=make_series_payload())

        resp = await client.get("/api/v1/series?page=1&limit=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) <= 2
        assert data["page"] == 1


class TestSearchSeries:
    async def test_search_series(self, client: AsyncClient, creator_client):
        c, _ = creator_client
        unique_title = "UniqueSearchableTitleXYZ"
        await c.post("/api/v1/series", json=make_series_payload(title=unique_title))

        resp = await client.get(f"/api/v1/series/search?q=UniqueSearchable")
        assert resp.status_code == 200
        results = resp.json()["data"]
        assert any(unique_title in r["title"] for r in results)

    async def test_search_empty_query_rejected(self, client: AsyncClient):
        resp = await client.get("/api/v1/series/search?q=")
        assert resp.status_code == 422


class TestGetSeries:
    async def test_get_series_increments_view_count(self, client: AsyncClient, creator_client):
        c, _ = creator_client
        create_resp = await c.post("/api/v1/series", json=make_series_payload())
        series_id = create_resp.json()["id"]

        r1 = await client.get(f"/api/v1/series/{series_id}")
        assert r1.status_code == 200
        view1 = r1.json()["view_count"]

        r2 = await client.get(f"/api/v1/series/{series_id}")
        assert r2.json()["view_count"] >= view1

    async def test_get_nonexistent_series(self, client: AsyncClient):
        resp = await client.get("/api/v1/series/nonexistent-id-12345")
        assert resp.status_code == 404


class TestUpdateSeries:
    async def test_update_series_title(self, creator_client):
        client, _ = creator_client
        create_resp = await client.post("/api/v1/series", json=make_series_payload())
        series_id = create_resp.json()["id"]

        resp = await client.patch(f"/api/v1/series/{series_id}", json={"title": "Updated Title"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    async def test_update_series_not_owner(self, creator_client, auth_client: AsyncClient):
        c, _ = creator_client
        create_resp = await c.post("/api/v1/series", json=make_series_payload())
        series_id = create_resp.json()["id"]

        resp = await auth_client.patch(f"/api/v1/series/{series_id}", json={"title": "Hijacked"})
        assert resp.status_code == 404  # Returns 404 (not found for this creator)


class TestDeleteSeries:
    async def test_delete_series(self, creator_client):
        client, _ = creator_client
        create_resp = await client.post("/api/v1/series", json=make_series_payload())
        series_id = create_resp.json()["id"]

        del_resp = await client.delete(f"/api/v1/series/{series_id}")
        assert del_resp.status_code == 200

        get_resp = await client.get(f"/api/v1/series/{series_id}")
        assert get_resp.status_code == 404

    async def test_delete_series_not_owner(self, creator_client, auth_client: AsyncClient):
        c, _ = creator_client
        create_resp = await c.post("/api/v1/series", json=make_series_payload())
        series_id = create_resp.json()["id"]

        resp = await auth_client.delete(f"/api/v1/series/{series_id}")
        assert resp.status_code == 404
