import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { watchlistAPI } from '../../src/api';
import { useAuth } from '../../src/AuthContext';

interface WatchlistItem {
  series_id: string;
  title: string;
  thumbnail_base64: string | null;
  genre: string;
  added_at: string;
}

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function WatchlistScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWatchlist = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await watchlistAPI.getAll();
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWatchlist();
  };

  const handleRemove = async (seriesId: string) => {
    try {
      await watchlistAPI.remove(seriesId);
      setItems(items.filter(i => i.series_id !== seriesId));
    } catch {}
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My List</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>Save Your Favorites</Text>
          <Text style={styles.emptySubtext}>Sign in to create your personal watchlist</Text>
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
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My List</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.cyan} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>My List</Text>
        <Text style={styles.countText}>{items.length} series</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.series_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.cyan} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>Your List is Empty</Text>
            <Text style={styles.emptySubtext}>Browse original anime series and add them to your watchlist</Text>
            <TouchableOpacity onPress={() => router.push('/browse')} style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>Browse Series</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/series/${item.series_id}`)}
            style={styles.listItem}
            activeOpacity={0.8}
          >
            <View style={styles.listItemContent}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.listItemMeta}>
                  <Text style={styles.listItemGenre}>{item.genre}</Text>
                </View>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity onPress={() => handleRemove(item.series_id)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.brand.error} />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  countText: { color: Colors.text.muted, fontSize: 14 },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  listItem: {
    marginBottom: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden',
    backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.border,
  },
  listItemContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md,
  },
  listItemLeft: { flex: 1, marginRight: Spacing.sm },
  listItemTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  listItemMeta: { flexDirection: 'row', alignItems: 'center' },
  listItemGenre: { color: Colors.brand.pink, fontSize: 12, fontWeight: '600' },
  listItemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  removeBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: 8 },
  emptySubtext: { fontSize: 14, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
  signInBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  signInGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  signInText: { color: '#000', fontWeight: '700', fontSize: 16 },
  browseBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.brand.cyan,
  },
  browseBtnText: { color: Colors.brand.cyan, fontWeight: '600', fontSize: 14 },
});
