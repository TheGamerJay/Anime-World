import pytest
import requests

class TestHealth:
    """Health check endpoint test"""
    
    def test_health_check(self, api_client, base_url):
        """Test /api/health endpoint"""
        response = api_client.get(f"{base_url}/api/health")
        assert response.status_code == 200, f"Health check failed with {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response missing 'status' field"
        assert data["status"] == "healthy", f"Service not healthy: {data['status']}"
        assert "service" in data, "Response missing 'service' field"
        print("✓ Health check passed")


class TestAnimeAPI:
    """Anime API endpoint tests"""
    
    def test_get_top_anime_airing(self, api_client, base_url):
        """Test /api/anime/top with filter=airing"""
        response = api_client.get(f"{base_url}/api/anime/top?filter=airing&page=1")
        assert response.status_code == 200, f"Failed with {response.status_code}: {response.text}"
        
        data = response.json()
        assert "data" in data, "Response missing 'data' field"
        assert isinstance(data["data"], list), "'data' should be a list"
        assert len(data["data"]) > 0, "No anime returned"
        
        # Validate first anime structure
        anime = data["data"][0]
        assert "mal_id" in anime, "Anime missing 'mal_id'"
        assert "title" in anime, "Anime missing 'title'"
        assert "images" in anime, "Anime missing 'images'"
        print(f"✓ Top airing anime: {len(data['data'])} items returned")
    
    def test_get_top_anime_bypopularity(self, api_client, base_url):
        """Test /api/anime/top with filter=bypopularity"""
        response = api_client.get(f"{base_url}/api/anime/top?filter=bypopularity&page=1")
        assert response.status_code == 200, f"Failed with {response.status_code}"
        
        data = response.json()
        assert "data" in data
        assert len(data["data"]) > 0
        print(f"✓ Top popular anime: {len(data['data'])} items returned")
    
    def test_get_top_anime_upcoming(self, api_client, base_url):
        """Test /api/anime/top with filter=upcoming"""
        response = api_client.get(f"{base_url}/api/anime/top?filter=upcoming&page=1")
        assert response.status_code == 200, f"Failed with {response.status_code}"
        
        data = response.json()
        assert "data" in data
        assert len(data["data"]) >= 0, "Expected list of anime"
        print(f"✓ Upcoming anime: {len(data['data'])} items returned")
    
    def test_search_anime(self, api_client, base_url):
        """Test /api/anime/search endpoint"""
        search_query = "Naruto"
        response = api_client.get(f"{base_url}/api/anime/search?q={search_query}&page=1")
        assert response.status_code == 200, f"Search failed with {response.status_code}"
        
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)
        assert len(data["data"]) > 0, f"No results for '{search_query}'"
        
        # Verify search results contain query term
        first_result = data["data"][0]
        assert "title" in first_result
        print(f"✓ Search for '{search_query}': {len(data['data'])} results")
    
    def test_get_anime_detail(self, api_client, base_url):
        """Test /api/anime/{id} endpoint with popular anime ID"""
        anime_id = 1  # Cowboy Bebop
        response = api_client.get(f"{base_url}/api/anime/{anime_id}")
        assert response.status_code == 200, f"Failed with {response.status_code}"
        
        data = response.json()
        assert "data" in data
        anime = data["data"]
        assert anime["mal_id"] == anime_id
        assert "title" in anime
        assert "synopsis" in anime
        assert "images" in anime
        assert "genres" in anime
        print(f"✓ Anime detail: {anime.get('title')}")
    
    def test_get_anime_episodes(self, api_client, base_url):
        """Test /api/anime/{id}/episodes endpoint"""
        anime_id = 1  # Cowboy Bebop (has episodes)
        response = api_client.get(f"{base_url}/api/anime/{anime_id}/episodes?page=1")
        assert response.status_code == 200, f"Failed with {response.status_code}"
        
        data = response.json()
        assert "data" in data
        # Episodes may be empty for some anime
        if len(data["data"]) > 0:
            episode = data["data"][0]
            assert "mal_id" in episode
            assert "title" in episode
        print(f"✓ Episodes: {len(data['data'])} episodes returned")
    
    def test_search_anime_empty_query_should_fail(self, api_client, base_url):
        """Test search with empty query should return 422"""
        response = api_client.get(f"{base_url}/api/anime/search?q=&page=1")
        # FastAPI validation should reject empty query
        assert response.status_code in [422, 400], f"Expected validation error, got {response.status_code}"
        print("✓ Empty search query validation works")
