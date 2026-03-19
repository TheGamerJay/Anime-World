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
  becomeCreator: () => apiCall('/auth/become-creator', { method: 'PUT', auth: true }),
};

// Series (Original Content)
export const seriesAPI = {
  getAll: (genre?: string, sort?: string, page = 1) => {
    const params = new URLSearchParams();
    if (genre && genre !== 'all') params.append('genre', genre);
    if (sort) params.append('sort', sort);
    params.append('page', page.toString());
    return apiCall(`/series?${params.toString()}`);
  },
  search: (q: string) => apiCall(`/series/search?q=${encodeURIComponent(q)}`),
  get: (id: string) => apiCall(`/series/${id}`),
  getEpisodes: (id: string) => apiCall(`/series/${id}/episodes`),
  create: (data: any) => apiCall('/series', { method: 'POST', body: data, auth: true }),
  delete: (id: string) => apiCall(`/series/${id}`, { method: 'DELETE', auth: true }),
};

// Episodes
export const episodeAPI = {
  create: (data: any) => apiCall('/episodes', { method: 'POST', body: data, auth: true }),
  delete: (id: string) => apiCall(`/episodes/${id}`, { method: 'DELETE', auth: true }),
};

// Creators
export const creatorAPI = {
  getProfile: (userId: string) => apiCall(`/creators/${userId}`),
  getTopCreators: () => apiCall('/feed/top-creators'),
};

// Feed
export const feedAPI = {
  getFeatured: () => apiCall('/feed/featured'),
  getTrending: () => apiCall('/feed/trending'),
  getLatest: () => apiCall('/feed/latest'),
  getGenres: () => apiCall('/genres'),
};

// Follow System
export const followAPI = {
  follow: (creatorId: string) => apiCall(`/follow/${creatorId}`, { method: 'POST', auth: true }),
  unfollow: (creatorId: string) => apiCall(`/follow/${creatorId}`, { method: 'DELETE', auth: true }),
  checkFollow: (creatorId: string) => apiCall(`/follow/check/${creatorId}`, { auth: true }),
};

// Likes
export const likeAPI = {
  toggleLike: (seriesId: string) => apiCall(`/like/series/${seriesId}`, { method: 'POST', auth: true }),
  checkLike: (seriesId: string) => apiCall(`/like/check/${seriesId}`, { auth: true }),
};

// Watchlist
export const watchlistAPI = {
  getAll: () => apiCall('/watchlist', { auth: true }),
  add: (seriesId: string) => apiCall(`/watchlist/${seriesId}`, { method: 'POST', auth: true }),
  remove: (seriesId: string) => apiCall(`/watchlist/${seriesId}`, { method: 'DELETE', auth: true }),
};

// My Content (Creator Studio)
export const myContentAPI = {
  getMySeries: () => apiCall('/my/series', { auth: true }),
  getMyEarnings: () => apiCall('/my/earnings', { auth: true }),
};

// Payments
export const paymentsAPI = {
  createTip: (tipSize: string, creatorId: string, originUrl: string) =>
    apiCall(`/payments/tip?tip_size=${tipSize}&creator_id=${creatorId}&origin_url=${encodeURIComponent(originUrl)}`, { method: 'POST', auth: true }),
  createPremium: (originUrl: string) =>
    apiCall(`/payments/premium?origin_url=${encodeURIComponent(originUrl)}`, { method: 'POST', auth: true }),
  createChannelSub: (creatorId: string, originUrl: string) =>
    apiCall(`/payments/channel-sub?creator_id=${creatorId}&origin_url=${encodeURIComponent(originUrl)}`, { method: 'POST', auth: true }),
  getStatus: (sessionId: string) => apiCall(`/payments/status/${sessionId}`),
};

// Profile Update
export const profileAPI = {
  update: (bio: string, avatarColor: string) =>
    apiCall(`/profile/update?bio=${encodeURIComponent(bio)}&avatar_color=${encodeURIComponent(avatarColor)}`, { method: 'PUT', auth: true }),
};

// Seed (dev only)
export const seedAPI = {
  seed: () => apiCall('/seed', { method: 'POST' }),
};
