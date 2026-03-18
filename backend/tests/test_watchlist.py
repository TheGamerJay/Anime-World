import pytest
import requests

class TestWatchlistFlow:
    """Watchlist CRUD tests"""
    
    def test_get_empty_watchlist(self, authenticated_client, base_url):
        """Test getting empty watchlist for new user"""
        client, token, credentials = authenticated_client
        
        response = client.get(f"{base_url}/api/watchlist")
        assert response.status_code == 200, f"Failed: {response.status_code}"
        
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"✓ Watchlist retrieved: {len(data['items'])} items")
    
    def test_add_to_watchlist_and_verify(self, authenticated_client, base_url):
        """Test adding anime to watchlist and verifying persistence"""
        client, token, credentials = authenticated_client
        
        watchlist_item = {
            "anime_id": 1,
            "title": "Cowboy Bebop",
            "image_url": "https://cdn.myanimelist.net/images/anime/4/19644.jpg",
            "score": 8.9,
            "episodes": 26,
            "status": "Finished Airing"
        }
        
        # Add to watchlist
        add_response = client.post(
            f"{base_url}/api/watchlist",
            json=watchlist_item
        )
        assert add_response.status_code == 200, f"Add failed: {add_response.status_code} - {add_response.text}"
        
        added_data = add_response.json()
        assert added_data["anime_id"] == watchlist_item["anime_id"]
        assert added_data["title"] == watchlist_item["title"]
        assert "id" in added_data
        assert "added_at" in added_data
        
        # GET to verify persistence
        get_response = client.get(f"{base_url}/api/watchlist")
        assert get_response.status_code == 200
        
        watchlist_data = get_response.json()
        assert len(watchlist_data["items"]) > 0, "Watchlist should contain the added item"
        
        # Verify the item is in the list
        found = any(item["anime_id"] == 1 for item in watchlist_data["items"])
        assert found, "Added anime not found in watchlist"
        
        print(f"✓ Added and verified anime in watchlist: {watchlist_item['title']}")
    
    def test_check_watchlist_status(self, authenticated_client, base_url):
        """Test /api/watchlist/check/{anime_id} endpoint"""
        client, token, credentials = authenticated_client
        
        # Add anime to watchlist first
        watchlist_item = {
            "anime_id": 5,
            "title": "Fullmetal Alchemist: Brotherhood",
            "image_url": "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
            "score": 9.1,
            "episodes": 64,
            "status": "Finished Airing"
        }
        
        add_response = client.post(f"{base_url}/api/watchlist", json=watchlist_item)
        assert add_response.status_code == 200
        
        # Check if it's in watchlist
        check_response = client.get(f"{base_url}/api/watchlist/check/5")
        assert check_response.status_code == 200
        
        check_data = check_response.json()
        assert "in_watchlist" in check_data
        assert check_data["in_watchlist"] == True
        
        # Check anime NOT in watchlist
        check_not_in = client.get(f"{base_url}/api/watchlist/check/99999")
        assert check_not_in.status_code == 200
        assert check_not_in.json()["in_watchlist"] == False
        
        print("✓ Watchlist check endpoint works")
    
    def test_remove_from_watchlist(self, authenticated_client, base_url):
        """Test removing anime from watchlist"""
        client, token, credentials = authenticated_client
        
        # Add anime first
        watchlist_item = {
            "anime_id": 20,
            "title": "Naruto",
            "image_url": "https://cdn.myanimelist.net/images/anime/13/17405.jpg",
            "score": 7.9,
            "episodes": 220,
            "status": "Finished Airing"
        }
        
        add_response = client.post(f"{base_url}/api/watchlist", json=watchlist_item)
        assert add_response.status_code == 200
        
        # Remove it
        remove_response = client.delete(f"{base_url}/api/watchlist/20")
        assert remove_response.status_code == 200
        
        remove_data = remove_response.json()
        assert "message" in remove_data
        
        # Verify it's removed by checking watchlist
        get_response = client.get(f"{base_url}/api/watchlist")
        assert get_response.status_code == 200
        
        items = get_response.json()["items"]
        found = any(item["anime_id"] == 20 for item in items)
        assert not found, "Anime should be removed from watchlist"
        
        print("✓ Removed anime from watchlist successfully")
    
    def test_add_duplicate_to_watchlist_should_fail(self, authenticated_client, base_url):
        """Test adding same anime twice fails"""
        client, token, credentials = authenticated_client
        
        watchlist_item = {
            "anime_id": 30,
            "title": "Test Anime",
            "image_url": "https://example.com/image.jpg",
            "score": 8.0,
            "episodes": 12,
            "status": "Airing"
        }
        
        # Add first time
        response1 = client.post(f"{base_url}/api/watchlist", json=watchlist_item)
        assert response1.status_code == 200
        
        # Try to add again
        response2 = client.post(f"{base_url}/api/watchlist", json=watchlist_item)
        assert response2.status_code == 400, "Duplicate add should return 400"
        
        data = response2.json()
        assert "already" in data["detail"].lower()
        print("✓ Duplicate watchlist item validation works")
    
    def test_watchlist_without_auth_should_fail(self, api_client, base_url):
        """Test watchlist endpoints require authentication"""
        # Try to get watchlist without token
        response = api_client.get(f"{base_url}/api/watchlist")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Watchlist protected by authentication")
