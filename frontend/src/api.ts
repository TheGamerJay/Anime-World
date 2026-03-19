import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface RequestOptions {
  method?: string;
  body?: any;
  auth?: boolean;
}

async function apiCall(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body, auth = false } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${BACKEND_URL}/api${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || 'API request failed');
  }
  return data;
}

// Auth
export const authAPI = {
  register: (username: string, email: string, password: string) =>
    apiCall('/auth/register', { method: 'POST', body: { username, email, password } }),
  login: (email: string, password: string) =>
    apiCall('/auth/login', { method: 'POST', body: { email, password } }),
  getMe: () => apiCall('/auth/me', { auth: true }),
};

// Anime
export const animeAPI = {
  search: (q: string, page = 1) => apiCall(`/anime/search?q=${encodeURIComponent(q)}&page=${page}`),
  getTop: (filter = 'airing', page = 1) => apiCall(`/anime/top?filter=${filter}&page=${page}`),
  getSeasonal: (year: number, season: string, page = 1) =>
    apiCall(`/anime/seasonal?year=${year}&season=${season}&page=${page}`),
  getGenres: () => apiCall('/anime/genres'),
  getDetail: (id: number) => apiCall(`/anime/${id}`),
  getEpisodes: (id: number, page = 1) => apiCall(`/anime/${id}/episodes?page=${page}`),
  getRecommendations: (id: number) => apiCall(`/anime/${id}/recommendations`),
};

// Watchlist
export const watchlistAPI = {
  getAll: () => apiCall('/watchlist', { auth: true }),
  add: (item: any) => apiCall('/watchlist', { method: 'POST', body: item, auth: true }),
  remove: (animeId: number) => apiCall(`/watchlist/${animeId}`, { method: 'DELETE', auth: true }),
  check: (animeId: number) => apiCall(`/watchlist/check/${animeId}`, { auth: true }),
};

// History
export const historyAPI = {
  update: (item: any) => apiCall('/history', { method: 'POST', body: item, auth: true }),
  getAll: () => apiCall('/history', { auth: true }),
};

// Profiles
export const profilesAPI = {
  getAll: () => apiCall('/profiles', { auth: true }),
  create: (name: string, avatar_color: string) => apiCall('/profiles', { method: 'POST', body: { name, avatar_color }, auth: true }),
  switchTo: (profileId: string) => apiCall(`/profiles/${profileId}/switch`, { method: 'PUT', auth: true }),
  remove: (profileId: string) => apiCall(`/profiles/${profileId}`, { method: 'DELETE', auth: true }),
};
