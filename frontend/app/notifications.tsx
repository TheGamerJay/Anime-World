import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { notificationAPI } from '../src/api';
import { useAuth } from '../src/AuthContext';

interface Notification {
  id: string;
  type: string;
  message: string;
  related_id: string;
  read: boolean;
  created_at: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string): { name: string; color: string } {
  switch (type) {
    case 'comment': return { name: 'chatbubble', color: Colors.brand.cyan };
    case 'follow': return { name: 'person-add', color: Colors.brand.pink };
    case 'tip': return { name: 'gift', color: Colors.brand.warning };
    case 'like': return { name: 'heart', color: Colors.brand.error };
    case 'new_episode': return { name: 'play-circle', color: Colors.brand.success };
    default: return { name: 'notifications', color: Colors.text.muted };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationPress = async (notif: Notification) => {
    // Mark as read
    if (!notif.read) {
      try {
        await notificationAPI.markRead(notif.id);
        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch {}
    }

    // Navigate based on type
    if (notif.related_id) {
      switch (notif.type) {
        case 'comment':
        case 'like':
        case 'new_episode':
          router.push(`/series/${notif.related_id}`);
          break;
        case 'follow':
          router.push(`/creator/${notif.related_id}`);
          break;
        default:
          break;
      }
    }
  };

  const handleDelete = async (notifId: string) => {
    try {
      await notificationAPI.delete(notifId);
      setNotifications(notifications.filter(n => n.id !== notifId));
    } catch {}
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>Stay Updated</Text>
          <Text style={styles.emptySubtext}>Sign in to see your notifications</Text>
          <TouchableOpacity onPress={() => router.push('/auth')} style={styles.signInBtn}>
            <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signInGradient}>
              <Text style={styles.signInText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.cyan} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markReadBtn}>
            <Ionicons name="checkmark-done" size={20} color={Colors.brand.cyan} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.cyan} />}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtext}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const icon = getNotificationIcon(notif.type);
            return (
              <TouchableOpacity
                key={notif.id}
                onPress={() => handleNotificationPress(notif)}
                style={[styles.notifItem, !notif.read && styles.notifItemUnread]}
              >
                <View style={[styles.notifIcon, { backgroundColor: icon.color + '20' }]}>
                  <Ionicons name={icon.name as any} size={20} color={icon.color} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifMessage, !notif.read && styles.notifMessageUnread]}>
                    {notif.message}
                  </Text>
                  <Text style={styles.notifTime}>{formatTimeAgo(notif.created_at)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(notif.id)} style={styles.deleteBtn}>
                  <Ionicons name="close" size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  markReadBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  unreadBanner: {
    backgroundColor: Colors.brand.cyanDim, paddingVertical: 8, paddingHorizontal: Spacing.md,
  },
  unreadText: { color: Colors.brand.cyan, fontSize: 13, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  emptySubtext: { fontSize: 14, color: Colors.text.muted, textAlign: 'center' },
  signInBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  signInGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  signInText: { color: '#000', fontWeight: '700', fontSize: 16 },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  notifItemUnread: { backgroundColor: Colors.brand.cyanDim, borderColor: Colors.brand.cyan + '50' },
  notifIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifMessage: { color: Colors.text.secondary, fontSize: 14, lineHeight: 20 },
  notifMessageUnread: { color: Colors.text.primary, fontWeight: '600' },
  notifTime: { color: Colors.text.muted, fontSize: 11, marginTop: 4 },
  deleteBtn: { padding: 8 },
});
