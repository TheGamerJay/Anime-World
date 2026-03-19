import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
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

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  becomeCreator: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  becomeCreator: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  async function loadAuth() {
    try {
      const savedToken = await AsyncStorage.getItem('auth_token');
      if (savedToken) {
        setToken(savedToken);
        const userData = await authAPI.getMe();
        setUser(userData);
      }
    } catch {
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await authAPI.login(email, password);
    await AsyncStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(username: string, email: string, password: string) {
    const data = await authAPI.register(username, email, password);
    await AsyncStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function logout() {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch {}
  }, []);

  async function becomeCreator() {
    await authAPI.becomeCreator();
    await refreshUser();
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, becomeCreator }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
