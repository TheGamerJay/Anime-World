export interface Series {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar_color: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  thumbnail_base64: string | null;
  cover_base64: string | null;
  episode_count: number;
  view_count: number;
  like_count: number;
  subscriber_count: number;
  is_featured: boolean;
  status: string;
  created_at: string;
}

export interface Episode {
  id: string;
  series_id: string;
  creator_id: string;
  title: string;
  description: string;
  episode_number: number;
  video_url: string;
  thumbnail_base64: string | null;
  is_premium: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
}

export interface Creator {
  id: string;
  username: string;
  avatar_color: string;
  bio: string;
  is_creator: boolean;
  is_premium: boolean;
  follower_count: number;
  following_count: number;
  total_earnings: number;
  balance: number;
  created_at: string;
}
