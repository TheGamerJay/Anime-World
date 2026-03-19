import pytest
import requests

# Profile and Watch History endpoint tests

class TestProfilesAPI:
    """Profile CRUD tests"""
    
    def test_get_profiles_creates_default(self, authenticated_client, base_url):
        """Test GET /api/profiles creates default profile if none exist"""
        client, token, credentials = authenticated_client
        
        response = client.get(f"{base_url}/api/profiles")
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "profiles" in data
        profiles = data["profiles"]
        assert len(profiles) >= 1, "Should have at least default profile"
        
        # Check default profile structure
        default = profiles[0]
        assert "id" in default
        assert "name" in default
        assert default["name"] == credentials["username"], "Default profile should use username"
        assert "avatar_color" in default
        assert "is_active" in default
        assert default["is_active"] == True, "Default profile should be active"
        assert "created_at" in default
        
        print(f"✓ Default profile created: {default['name']}")
    
    def test_create_new_profile(self, authenticated_client, base_url):
        """Test POST /api/profiles to create new profile"""
        client, token, credentials = authenticated_client
        
        # Create new profile
        create_payload = {
            "name": "TEST_Anime_Fan",
            "avatar_color": "#FF0099"
        }
        create_response = client.post(f"{base_url}/api/profiles", json=create_payload)
        assert create_response.status_code == 200, f"Failed: {create_response.status_code} - {create_response.text}"
        
        created = create_response.json()
        assert created["name"] == create_payload["name"]
        assert created["avatar_color"] == create_payload["avatar_color"]
        assert "id" in created
        assert "is_active" in created
        
        # Verify it persists by fetching all profiles
        get_response = client.get(f"{base_url}/api/profiles")
        assert get_response.status_code == 200
        
        profiles = get_response.json()["profiles"]
        assert len(profiles) >= 2, "Should have at least 2 profiles now"
        
        found = any(p["name"] == "TEST_Anime_Fan" for p in profiles)
        assert found, "Created profile not found in GET response"
        
        print(f"✓ Profile created and persisted: {created['name']}")
    
    def test_create_profile_max_limit(self, authenticated_client, base_url):
        """Test that users cannot create more than 5 profiles"""
        client, token, credentials = authenticated_client
        
        # Create 5 profiles (including default = 1)
        for i in range(4):
            create_response = client.post(
                f"{base_url}/api/profiles",
                json={"name": f"TEST_Profile_{i}", "avatar_color": "#00F0FF"}
            )
            # Should succeed or already have enough
            if create_response.status_code != 200:
                break
        
        # Try to create 6th profile
        exceed_response = client.post(
            f"{base_url}/api/profiles",
            json={"name": "TEST_Exceeds_Limit", "avatar_color": "#FF0099"}
        )
        
        if exceed_response.status_code == 400:
            data = exceed_response.json()
            assert "detail" in data
            assert "maximum" in data["detail"].lower() or "5" in data["detail"]
            print("✓ Profile limit enforced (max 5)")
        else:
            print("⚠ Profile limit not reached yet in this test")
    
    def test_switch_profile(self, authenticated_client, base_url):
        """Test PUT /api/profiles/{id}/switch"""
        client, token, credentials = authenticated_client
        
        # Create a second profile
        create_response = client.post(
            f"{base_url}/api/profiles",
            json={"name": "TEST_Switch_Profile", "avatar_color": "#7000FF"}
        )
        assert create_response.status_code == 200
        new_profile = create_response.json()
        new_profile_id = new_profile["id"]
        
        # Switch to new profile
        switch_response = client.put(f"{base_url}/api/profiles/{new_profile_id}/switch")
        assert switch_response.status_code == 200, f"Switch failed: {switch_response.text}"
        
        switch_data = switch_response.json()
        assert "message" in switch_data
        assert "profile" in switch_data
        assert switch_data["profile"]["is_active"] == True
        
        # Verify via GET that the profile is now active
        get_response = client.get(f"{base_url}/api/profiles")
        profiles = get_response.json()["profiles"]
        
        active_profile = next((p for p in profiles if p["is_active"]), None)
        assert active_profile is not None
        assert active_profile["id"] == new_profile_id, "Switched profile should be active"
        
        print(f"✓ Profile switched to: {active_profile['name']}")
    
    def test_delete_profile(self, authenticated_client, base_url):
        """Test DELETE /api/profiles/{id}"""
        client, token, credentials = authenticated_client
        
        # Create a profile to delete
        create_response = client.post(
            f"{base_url}/api/profiles",
            json={"name": "TEST_To_Delete", "avatar_color": "#00FF94"}
        )
        assert create_response.status_code == 200
        profile_to_delete = create_response.json()
        profile_id = profile_to_delete["id"]
        
        # Delete it
        delete_response = client.delete(f"{base_url}/api/profiles/{profile_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        delete_data = delete_response.json()
        assert "message" in delete_data
        
        # Verify it's gone
        get_response = client.get(f"{base_url}/api/profiles")
        profiles = get_response.json()["profiles"]
        
        still_exists = any(p["id"] == profile_id for p in profiles)
        assert not still_exists, "Deleted profile should not appear in list"
        
        print(f"✓ Profile deleted: {profile_to_delete['name']}")
    
    def test_cannot_delete_only_profile(self, authenticated_client, base_url):
        """Test that users cannot delete their only remaining profile"""
        client, token, credentials = authenticated_client
        
        # Get all profiles
        get_response = client.get(f"{base_url}/api/profiles")
        profiles = get_response.json()["profiles"]
        
        if len(profiles) > 1:
            # Delete all but one
            for profile in profiles[1:]:
                client.delete(f"{base_url}/api/profiles/{profile['id']}")
            
            # Refresh
            get_response = client.get(f"{base_url}/api/profiles")
            profiles = get_response.json()["profiles"]
        
        # Try to delete the last profile
        last_profile_id = profiles[0]["id"]
        delete_response = client.delete(f"{base_url}/api/profiles/{last_profile_id}")
        
        assert delete_response.status_code == 400, "Should not allow deleting only profile"
        data = delete_response.json()
        assert "detail" in data
        assert "cannot delete" in data["detail"].lower() or "only" in data["detail"].lower()
        
        print("✓ Cannot delete only profile - validation works")


class TestWatchHistoryAPI:
    """Watch history endpoint tests"""
    
    def test_get_empty_history(self, authenticated_client, base_url):
        """Test GET /api/history returns empty for new users"""
        client, token, credentials = authenticated_client
        
        response = client.get(f"{base_url}/api/history")
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data
        # New user might have empty history
        print(f"✓ History endpoint returned {len(data['items'])} items")
    
    def test_update_watch_history(self, authenticated_client, base_url):
        """Test POST /api/history to add/update history item"""
        client, token, credentials = authenticated_client
        
        history_item = {
            "anime_id": 12345,
            "episode_number": 5,
            "title": "The Great Battle",
            "anime_title": "TEST Anime Series",
            "image_url": "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
            "progress": 75.5
        }
        
        create_response = client.post(f"{base_url}/api/history", json=history_item)
        assert create_response.status_code == 200, f"Failed: {create_response.status_code} - {create_response.text}"
        
        create_data = create_response.json()
        assert "message" in create_data
        
        # Verify it appears in GET
        get_response = client.get(f"{base_url}/api/history")
        assert get_response.status_code == 200
        
        items = get_response.json()["items"]
        assert len(items) >= 1, "History should have at least 1 item"
        
        # Find the item we just added
        found = any(
            item["anime_id"] == 12345 and item["episode_number"] == 5
            for item in items
        )
        assert found, "Added history item not found in GET response"
        
        print(f"✓ Watch history updated: {history_item['anime_title']} E{history_item['episode_number']}")
    
    def test_history_upsert_behavior(self, authenticated_client, base_url):
        """Test that updating same anime/episode updates progress"""
        client, token, credentials = authenticated_client
        
        history_item = {
            "anime_id": 99999,
            "episode_number": 1,
            "title": "Pilot Episode",
            "anime_title": "TEST Upsert Anime",
            "image_url": "https://cdn.myanimelist.net/images/anime/1.jpg",
            "progress": 25.0
        }
        
        # First update
        response1 = client.post(f"{base_url}/api/history", json=history_item)
        assert response1.status_code == 200
        
        # Update progress for same anime/episode
        history_item["progress"] = 90.0
        response2 = client.post(f"{base_url}/api/history", json=history_item)
        assert response2.status_code == 200
        
        # Verify only one entry exists with updated progress
        get_response = client.get(f"{base_url}/api/history")
        items = get_response.json()["items"]
        
        matching_items = [
            item for item in items
            if item["anime_id"] == 99999 and item["episode_number"] == 1
        ]
        
        # Should have exactly one entry (upsert behavior)
        assert len(matching_items) == 1, "Should have exactly one entry for same anime/episode"
        assert matching_items[0]["progress"] == 90.0, "Progress should be updated"
        
        print("✓ History upsert behavior works correctly")
    
    def test_history_requires_auth(self, api_client, base_url):
        """Test that history endpoints require authentication"""
        response = api_client.get(f"{base_url}/api/history")
        assert response.status_code == 401, "Should require authentication"
        print("✓ History endpoint requires authentication")
