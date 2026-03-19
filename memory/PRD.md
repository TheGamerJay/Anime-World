# Anime World - Crunchyroll Clone PRD

## Overview
Anime World is a mobile anime streaming platform clone built with React Native Expo and FastAPI, featuring a cotton candy (cyan & pink) cyberpunk theme.

## Tech Stack
- **Frontend**: React Native Expo (SDK 54), expo-router, expo-linear-gradient
- **Backend**: FastAPI (Python), httpx for Jikan API proxy
- **Database**: MongoDB (users, watchlist, watch history)
- **External API**: Jikan v4 (MyAnimeList) - no API key required, free
- **Auth**: JWT-based (bcrypt password hashing)

## Features

### Core
- [x] Browse anime catalog with real data from Jikan API
- [x] Anime detail pages with synopsis, genres, studios, ratings
- [x] Episode listings per anime
- [x] Simulated video player with progress bar
- [x] User authentication (register/login with JWT)
- [x] Watchlist/favorites management (add/remove)
- [x] Watch history tracking
- [x] Search anime by title
- [x] Genre-based filtering
- [x] Pull-to-refresh on home screen

### AdSense & Legal Pages (all accessible from Profile)
- [x] Privacy Policy (GDPR + CCPA compliant, Google AdSense disclosure)
- [x] Terms of Service (comprehensive with liability, indemnification, arbitration)
- [x] Disclaimer (content, advertising, affiliate, fair use disclaimers)
- [x] DMCA / Copyright Policy (takedown notices, counter-notifications, repeat infringers)
- [x] Cookie Policy (essential, analytics, advertising cookies, Google AdSense cookies)
- [x] About Us (mission, data sources, commitment)
- [x] Contact Us (contact form with name, email, subject, message)

### Screens
- **Home**: Hero banner, Trending Now, Most Popular, Coming Soon sections
- **Browse**: Search bar, genre chips, 2-column grid results
- **My List**: Watchlist grid with remove functionality
- **Profile**: User info, switch profile, settings, watch history, legal pages, sign out
- **Switch Profile**: Multi-profile selector (up to 5), create/delete/switch profiles with custom colors
- **Settings**: Playback (autoplay, subtitles), video quality, language, notifications, data saver, mature content, clear cache/history
- **Watch History**: List of watched episodes with progress bars
- **Anime Detail**: Hero image, synopsis, episodes/details tabs, watchlist toggle
- **Episode Player**: Simulated player with progress, like/share/download buttons
- **Auth**: Login/register with form validation
- **7 Legal Pages**: Privacy Policy, Terms of Service, Disclaimer, DMCA/Copyright, Cookie Policy, About Us, Contact Us

### Design
- Cotton candy cyberpunk theme (Cyan #00F0FF + Pink #FF0099)
- Dark background (#09090B)
- Gradient accents on buttons and badges
- Tab-based navigation (4 tabs)

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user
- `GET /api/anime/search?q=` - Search anime
- `GET /api/anime/top?filter=` - Top anime (airing/upcoming/bypopularity/favorite)
- `GET /api/anime/{id}` - Anime details
- `GET /api/anime/{id}/episodes` - Episode list
- `GET /api/watchlist` - User's watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/{anime_id}` - Remove from watchlist
- `GET /api/watchlist/check/{anime_id}` - Check if in watchlist
- `POST /api/history` - Update watch history
- `GET /api/history` - Get watch history

## Limitations
- Video streaming is **simulated** (requires licensing for actual streaming)
- Jikan API has rate limits (3 req/sec, 60 req/min) - backend caches responses

## Future Enhancements
- Push notifications for new episodes
- Premium subscription tier with ad-free experience
- Social features (comments, ratings, friend activity)
- Offline download simulation
- Multi-language subtitle support
