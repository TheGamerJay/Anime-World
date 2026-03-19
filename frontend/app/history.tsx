import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth } from '../src/AuthContext';
import { historyAPI } from '../src/api';

export default function WatchHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const res = await historyAPI.getAll();
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity testID="history-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Watch History</Text>
          <View style={{ width: 40 }} />
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
        <TouchableOpacity testID="history-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch History</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>No watch history yet</Text>
          <Text style={styles.emptySubtext}>Episodes you watch will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, idx) => `history-${item.anime_id}-${item.episode_number}-${idx}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} tintColor={Colors.brand.cyan} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`history-item-${item.anime_id}`}
              onPress={() => router.push(`/anime/${item.anime_id}`)}
              style={styles.historyItem}
              activeOpacity={0.8}
            >
              <View style={styles.thumbContainer}>
                <Image source={{ uri: item.image_url }} style={styles.thumb} />
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={16} color="#fff" />
                </View>
                {item.progress > 0 && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(item.progress, 100)}%` }]} />
                  </View>
                )}
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.animeTitle} numberOfLines={1}>{item.anime_title}</Text>
                <Text style={styles.episodeTitle} numberOfLines={1}>E{item.episode_number} - {item.title}</Text>
                <Text style={styles.watchedDate}>
                  {item.watched_at ? new Date(item.watched_at).toLocaleDateString() : 'Recently'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  emptySubtext: { fontSize: 14, color: Colors.text.muted },
  listContainer: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 100 },
  historyItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12, alignItems: 'center' },
  thumbContainer: { width: 130, height: 73, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: '100%', backgroundColor: Colors.brand.cyan },
  historyInfo: { flex: 1 },
  animeTitle: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 2 },
  episodeTitle: { fontSize: 13, color: Colors.text.secondary, marginBottom: 4 },
  watchedDate: { fontSize: 12, color: Colors.text.muted },
});
