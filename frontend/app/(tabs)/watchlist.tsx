import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { watchlistAPI } from '../../src/api';
import { useAuth } from '../../src/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - 12) / 2;

export default function WatchlistScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWatchlist = useCallback(async () => {
    if (!user) { setLoading(false); return; }
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

  const removeItem = async (animeId: number) => {
    try {
      await watchlistAPI.remove(animeId);
      setItems(prev => prev.filter(item => item.anime_id !== animeId));
    } catch (err) {
      console.error('Failed to remove:', err);
    }
  };

  if (authLoading) {
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My List</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={72} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>Sign in to save your favorites</Text>
          <Text style={styles.emptySubtext}>Keep track of anime you want to watch</Text>
          <TouchableOpacity testID="watchlist-login-btn" onPress={() => router.push('/auth')} style={styles.signInBtn}>
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
        <Text style={styles.itemCount}>{items.length} titles</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={72} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptySubtext}>Browse anime and add them to your list</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => `wl-${item.anime_id}`}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWatchlist(); }} tintColor={Colors.brand.cyan} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`watchlist-card-${item.anime_id}`}
              onPress={() => router.push(`/anime/${item.anime_id}`)}
              activeOpacity={0.8}
              style={styles.gridCard}
            >
              <Image source={{ uri: item.image_url }} style={styles.gridImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gridGradient} />
              <TouchableOpacity
                testID={`remove-watchlist-${item.anime_id}`}
                onPress={() => removeItem(item.anime_id)}
                style={styles.removeBtn}
              >
                <Ionicons name="close" size={16} color={Colors.text.primary} />
              </TouchableOpacity>
              <View style={styles.gridInfo}>
                <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
                {item.score && (
                  <View style={styles.scoreLine}>
                    <Ionicons name="star" size={10} color={Colors.brand.warning} />
                    <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
                  </View>
                )}
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
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  itemCount: { fontSize: 14, color: Colors.text.muted, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: Colors.text.muted, textAlign: 'center' },
  signInBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  signInGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  signInText: { color: '#000', fontWeight: '700', fontSize: 16 },
  gridContainer: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  gridRow: { gap: 12, marginBottom: 12 },
  gridCard: { width: CARD_WIDTH, height: CARD_WIDTH * 1.5, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  removeBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28,
    borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  gridInfo: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  gridTitle: { color: Colors.text.primary, fontWeight: '600', fontSize: 13, lineHeight: 18 },
  scoreLine: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  scoreText: { color: Colors.brand.warning, fontWeight: '700', fontSize: 11 },
});
