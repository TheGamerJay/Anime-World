"""
Unit / integration tests for authentication endpoints.

Tests cover:
- User registration (happy path, duplicate email, duplicate username)
- Login (valid credentials, invalid credentials)
- Token refresh
- /auth/me endpoint
- Become-creator upgrade
- Password reset flow
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient

pytestmark = pytest.mark.anyio


class TestRegister:
    async def test_register_success(self, client: AsyncClient, test_user_credentials):
        resp = await client.post("/api/auth/register", json=test_user_credentials)
        assert resp.status_code == 200, resp.text

        data = resp.json()
        assert "token" in data
        assert "user" in data

        user = data["user"]
        assert user["username"] == test_user_credentials["username"]
        assert user["email"] == test_user_credentials["email"]
        assert "id" in user
        assert "created_at" in user
        assert "password" not in user
        assert "password_hash" not in user

    async def test_register_duplicate_email(self, client: AsyncClient, test_user_credentials):
        # First registration
        r1 = await client.post("/api/auth/register", json=test_user_credentials)
        assert r1.status_code == 200

        # Second registration with same email
        r2 = await client.post("/api/auth/register", json=test_user_credentials)
        assert r2.status_code == 400
        assert "email" in r2.json()["detail"].lower() or "already" in r2.json()["detail"].lower()

    async def test_register_duplicate_username(self, client: AsyncClient, test_user_credentials):
        import random
        r1 = await client.post("/api/auth/register", json=test_user_credentials)
        assert r1.status_code == 200

        # Same username, different email
        payload = {**test_user_credentials, "email": f"other_{random.randint(1000,9999)}@example.com"}
        r2 = await client.post("/api/auth/register", json=payload)
        assert r2.status_code == 400

    async def test_register_weak_password_rejected(self, client: AsyncClient, test_user_credentials):
        """Password without a digit should be rejected by the v1 endpoint."""
        payload = {**test_user_credentials, "password": "nodigitshere"}
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422  # Pydantic validation error

    async def test_register_short_username_rejected(self, client: AsyncClient, test_user_credentials):
        payload = {**test_user_credentials, "username": "ab"}
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422

    async def test_register_invalid_email_rejected(self, client: AsyncClient, test_user_credentials):
        payload = {**test_user_credentials, "email": "not-an-email"}
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient, test_user_credentials):
        await client.post("/api/auth/register", json=test_user_credentials)

        resp = await client.post(
            "/api/auth/login",
            json={"email": test_user_credentials["email"], "password": test_user_credentials["password"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == test_user_credentials["email"]

    async def test_login_wrong_password(self, client: AsyncClient, test_user_credentials):
        await client.post("/api/auth/register", json=test_user_credentials)

        resp = await client.post(
            "/api/auth/login",
            json={"email": test_user_credentials["email"], "password": "WrongPass99"},
        )
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "ghost@nowhere.com", "password": "SomePass1"},
        )
        assert resp.status_code == 401

    async def test_login_returns_refresh_token(self, client: AsyncClient, test_user_credentials):
        """v1 login should return a refresh_token field."""
        await client.post("/api/v1/auth/register", json=test_user_credentials)
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user_credentials["email"], "password": test_user_credentials["password"]},
        )
        assert resp.status_code == 200
        assert "refresh_token" in resp.json()


class TestGetMe:
    async def test_get_me_authenticated(self, auth_client: AsyncClient, registered_user):
        resp = await auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == registered_user["user"]["email"]
        assert "password_hash" not in data

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401

    async def test_get_me_invalid_token(self, client: AsyncClient):
        client.headers.update({"Authorization": "Bearer invalid.token.here"})
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401


class TestBecomeCreator:
    async def test_become_creator(self, auth_client: AsyncClient):
        resp = await auth_client.put("/api/auth/become-creator")
        assert resp.status_code == 200

        # Verify the flag is set
        me = await auth_client.get("/api/auth/me")
        assert me.json()["is_creator"] is True

    async def test_become_creator_requires_auth(self, client: AsyncClient):
        resp = await client.put("/api/auth/become-creator")
        assert resp.status_code == 401


class TestTokenRefresh:
    async def test_refresh_token_flow(self, client: AsyncClient, test_user_credentials):
        """Register via v1, then exchange the refresh token for a new pair."""
        reg = await client.post("/api/v1/auth/register", json=test_user_credentials)
        assert reg.status_code == 200
        refresh_token = reg.json()["refresh_token"]
        assert refresh_token is not None

        resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert "refresh_token" in data
        # New refresh token should differ from the old one (rotation)
        assert data["refresh_token"] != refresh_token

    async def test_refresh_with_invalid_token(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": "bogus"})
        assert resp.status_code == 401


class TestForgotPassword:
    async def test_forgot_password_always_returns_200(self, client: AsyncClient):
        """Should not reveal whether the email exists."""
        resp = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "doesnotexist@example.com"},
        )
        assert resp.status_code == 200
        assert "message" in resp.json()

    async def test_forgot_password_for_existing_user(self, client: AsyncClient, test_user_credentials):
        await client.post("/api/v1/auth/register", json=test_user_credentials)
        resp = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_user_credentials["email"]},
        )
        assert resp.status_code == 200
