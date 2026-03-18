import pytest
import requests

class TestAuthFlow:
    """Authentication flow tests"""
    
    def test_register_new_user(self, api_client, base_url, test_user_credentials):
        """Test user registration"""
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json=test_user_credentials
        )
        
        assert response.status_code == 200, f"Registration failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "token" in data, "Response missing 'token'"
        assert "user" in data, "Response missing 'user'"
        
        user = data["user"]
        assert user["username"] == test_user_credentials["username"]
        assert user["email"] == test_user_credentials["email"]
        assert "id" in user
        assert "created_at" in user
        assert "password" not in user, "Password should not be in response"
        
        print(f"✓ User registered: {user['username']}")
    
    def test_register_duplicate_email_should_fail(self, api_client, base_url, test_user_credentials):
        """Test registering with duplicate email fails"""
        # Register first user
        response1 = api_client.post(
            f"{base_url}/api/auth/register",
            json=test_user_credentials
        )
        assert response1.status_code == 200
        
        # Try to register again with same email
        response2 = api_client.post(
            f"{base_url}/api/auth/register",
            json=test_user_credentials
        )
        assert response2.status_code == 400, "Duplicate email should return 400"
        
        data = response2.json()
        assert "detail" in data
        assert "already registered" in data["detail"].lower() or "already taken" in data["detail"].lower()
        print("✓ Duplicate email validation works")
    
    def test_login_with_valid_credentials(self, api_client, base_url, test_user_credentials):
        """Test login with correct credentials"""
        # Register user first
        reg_response = api_client.post(
            f"{base_url}/api/auth/register",
            json=test_user_credentials
        )
        assert reg_response.status_code == 200
        
        # Login
        login_response = api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "email": test_user_credentials["email"],
                "password": test_user_credentials["password"]
            }
        )
        
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        data = login_response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == test_user_credentials["email"]
        print(f"✓ Login successful: {data['user']['username']}")
    
    def test_login_with_invalid_credentials(self, api_client, base_url):
        """Test login with wrong password fails"""
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials rejected")
    
    def test_get_me_endpoint(self, authenticated_client, base_url):
        """Test /api/auth/me endpoint with valid token"""
        client, token, credentials = authenticated_client
        
        response = client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "username" in data
        assert "email" in data
        assert data["email"] == credentials["email"]
        print(f"✓ /auth/me returned user: {data['username']}")
    
    def test_get_me_without_token_should_fail(self, api_client, base_url):
        """Test /api/auth/me without authorization fails"""
        response = api_client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unauthorized access blocked")
