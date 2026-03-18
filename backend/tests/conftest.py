import pytest
import requests
import os

@pytest.fixture
def api_client():
    """Shared requests session for API calls"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def base_url():
    """Get base URL from environment"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
    if not url:
        pytest.fail("EXPO_PUBLIC_BACKEND_URL not set in environment")
    return url.rstrip('/')

@pytest.fixture
def test_user_credentials():
    """Test user credentials for auth tests"""
    import random
    random_suffix = random.randint(10000, 99999)
    return {
        "username": f"TEST_user_{random_suffix}",
        "email": f"TEST_user_{random_suffix}@test.com",
        "password": "testpass123"
    }

@pytest.fixture
def authenticated_client(api_client, base_url, test_user_credentials):
    """Client with authenticated session"""
    # Register new user
    reg_response = api_client.post(
        f"{base_url}/api/auth/register",
        json=test_user_credentials
    )
    
    if reg_response.status_code != 200:
        pytest.skip(f"Auth setup failed: {reg_response.status_code}")
    
    token = reg_response.json().get('token')
    api_client.headers.update({"Authorization": f"Bearer {token}"})
    
    return api_client, token, test_user_credentials
