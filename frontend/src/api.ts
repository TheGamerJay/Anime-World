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

  const res = await fetch(`${BACKEND_URL}/api/v1${endpoint}`, config);
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
  get: (id: string) => apiCall(`/episodes/${id}`),
  delete: (id: string) => apiCall(`/episodes/${id}`, { method: 'DELETE', auth: true }),
};

// Reports
export const reportAPI = {
  create: (data: { content_type: string; content_id: string; reason: string; details?: string }) =>
    apiCall('/reports', { method: 'POST', body: data, auth: true }),
  getMyReports: (status?: string) => apiCall(`/reports${status ? `?status=${status}` : ''}`, { auth: true }),
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

// Analytics
export const analyticsAPI = {
  getCreatorAnalytics: () => apiCall('/analytics/creator', { auth: true }),
  getFanAnalytics: () => apiCall('/analytics/fan', { auth: true }),
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
  update: (data: { bio?: string; avatar_color?: string }) =>
    apiCall('/profile', { method: 'PUT', body: data, auth: true }),
  uploadAvatar: async (fileUri: string, mimeType: string, fileName: string) => {
    const token = await AsyncStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as any);
    
    const res = await fetch(`${BACKEND_URL}/api/v1/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to upload avatar');
    }
    return data;
  },
  deleteAvatar: () => apiCall('/profile/avatar', { method: 'DELETE', auth: true }),
};

// Comments
export const commentAPI = {
  create: (data: { content_type: string; content_id: string; text: string; parent_id?: string }) =>
    apiCall('/comments', { method: 'POST', body: data, auth: true }),
  getComments: (contentType: string, contentId: string, page = 1) =>
    apiCall(`/comments/${contentType}/${contentId}?page=${page}`),
  delete: (commentId: string) => apiCall(`/comments/${commentId}`, { method: 'DELETE', auth: true }),
  like: (commentId: string) => apiCall(`/comments/${commentId}/like`, { method: 'POST', auth: true }),
};

// Notifications
export const notificationAPI = {
  getAll: () => apiCall('/notifications', { auth: true }),
  markAllRead: () => apiCall('/notifications/read', { method: 'PUT', auth: true }),
  markRead: (notifId: string) => apiCall(`/notifications/${notifId}/read`, { method: 'PUT', auth: true }),
  delete: (notifId: string) => apiCall(`/notifications/${notifId}`, { method: 'DELETE', auth: true }),
};

// Reading/Watch Progress
export const progressAPI = {
  update: (data: { series_id: string; episode_id: string; progress: number; completed?: boolean }) =>
    apiCall('/progress', { method: 'POST', body: data, auth: true }),
  getSeriesProgress: (seriesId: string) => apiCall(`/progress/${seriesId}`, { auth: true }),
  getContinueWatching: () => apiCall('/continue-watching', { auth: true }),
};

// Seed (dev only)
export const seedAPI = {
  seed: () => apiCall('/seed', { method: 'POST' }),
};
