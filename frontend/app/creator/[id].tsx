import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { creatorAPI, followAPI } from '../../src/api';
import { useAuth } from '../../src/AuthContext';
import { Creator, Series } from '../../src/types';

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorSeries, setCreatorSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadCreator();
  }, [id]);

  async function loadCreator() {
    if (!id) return;
    try {
      const res = await creatorAPI.getProfile(id);
      setCreator(res.creator);
      setCreatorSeries(res.series || []);

      if (user) {
        try {
          const followRes = await followAPI.checkFollow(id);
          setIsFollowing(followRes.is_following);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load creator:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFollow = async () => {
    if (!user || !creator) {
      router.push('/auth');
      return;
    }
    try {
      if (isFollowing) {
        await followAPI.unfollow(creator.id);
        setIsFollowing(false);
      } else {
        await followAPI.follow(creator.id);
        setIsFollowing(true);
      }
    } catch {}
  };

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

  if (!creator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Creator not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initial = creator.username.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Hero */}
        <LinearGradient
          colors={[creator.avatar_color + '40', Colors.bg.default]}
          style={styles.heroGradient}
        />
        <View style={styles.profileSection}>
          <LinearGradient colors={[creator.avatar_color, creator.avatar_color + '60']} style={styles.avatarGradient}>
            <View style={styles.avatarInner}>
              <Text style={[styles.avatarLetter, { color: creator.avatar_color }]}>{initial}</Text>
            </View>
          </LinearGradient>
          <Text style={styles.username}>{creator.username}</Text>
          {creator.bio && <Text style={styles.bio}>{creator.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCount(creator.follower_count)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{creatorSeries.length}</Text>
              <Text style={styles.statLabel}>Series</Text>
            </View>
          </View>

          {/* Follow Button */}
          {user?.id !== creator.id && (
            <TouchableOpacity onPress={handleFollow} style={styles.followBtn}>
              {isFollowing ? (
                <View style={styles.followBtnInner}>
                  <Ionicons name="checkmark" size={18} color={Colors.brand.cyan} />
                  <Text style={styles.followBtnText}>Following</Text>
                </View>
              ) : (
                <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.followBtnGradient}>
                  <Text style={styles.followBtnTextActive}>Follow</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Series */}
        <View style={styles.seriesSection}>
          <Text style={styles.sectionTitle}>Series ({creatorSeries.length})</Text>
          {creatorSeries.length === 0 ? (
            <View style={styles.noSeries}>
              <Ionicons name="film-outline" size={40} color={Colors.text.muted} />
              <Text style={styles.noSeriesText}>No series yet</Text>
            </View>
          ) : (
            creatorSeries.map((series) => (
              <TouchableOpacity
                key={series.id}
                onPress={() => router.push(`/series/${series.id}`)}
                style={styles.seriesItem}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[series.creator_avatar_color + '30', Colors.bg.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.seriesItemContent}>
                  <View style={styles.seriesItemLeft}>
                    <Text style={styles.seriesItemTitle} numberOfLines={1}>{series.title}</Text>
                    <View style={styles.seriesItemMeta}>
                      <Text style={styles.seriesItemGenre}>{series.genre}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.seriesItemEps}>{series.episode_count} episodes</Text>
                    </View>
                    <View style={styles.seriesItemStats}>
                      <Ionicons name="eye-outline" size={12} color={Colors.text.muted} />
                      <Text style={styles.statText}>{formatCount(series.view_count)}</Text>
                      <Ionicons name="heart" size={12} color={Colors.brand.pink} style={{ marginLeft: 8 }} />
                      <Text style={styles.statText}>{formatCount(series.like_count)}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.text.muted, fontSize: 16, marginBottom: 16 },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.bg.surface },
  backButtonText: { color: Colors.brand.cyan, fontWeight: '600' },
  header: { position: 'absolute', top: 10, left: 10, zIndex: 10 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroGradient: { height: 120, position: 'absolute', top: 0, left: 0, right: 0 },
  profileSection: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.md },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, padding: 3 },
  avatarInner: {
    flex: 1, borderRadius: 47, backgroundColor: Colors.bg.default,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 38, fontWeight: '800' },
  username: { fontSize: 26, fontWeight: '800', color: Colors.text.primary, marginTop: Spacing.md },
  bio: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
  },
  statItem: { alignItems: 'center', paddingHorizontal: 24 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  statLabel: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  followBtn: { marginTop: Spacing.md, borderRadius: Radius.full, overflow: 'hidden' },
  followBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: Colors.brand.cyan,
    borderRadius: Radius.full,
  },
  followBtnText: { color: Colors.brand.cyan, fontWeight: '600', fontSize: 14 },
  followBtnGradient: { paddingHorizontal: 28, paddingVertical: 12 },
  followBtnTextActive: { color: '#000', fontWeight: '700', fontSize: 14 },
  seriesSection: { padding: Spacing.md, marginTop: Spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: 16 },
  noSeries: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  noSeriesText: { color: Colors.text.muted, fontSize: 14 },
  seriesItem: {
    marginBottom: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  seriesItemContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md,
  },
  seriesItemLeft: { flex: 1, marginRight: Spacing.sm },
  seriesItemTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  seriesItemMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  seriesItemGenre: { color: Colors.brand.pink, fontSize: 12, fontWeight: '600' },
  metaDot: { color: Colors.text.muted, marginHorizontal: 6 },
  seriesItemEps: { color: Colors.text.muted, fontSize: 12 },
  seriesItemStats: { flexDirection: 'row', alignItems: 'center' },
  statText: { color: Colors.text.muted, fontSize: 11, marginLeft: 3 },
});
