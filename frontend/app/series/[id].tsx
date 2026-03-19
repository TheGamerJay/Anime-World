import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { seriesAPI, watchlistAPI, likeAPI, followAPI, paymentsAPI } from '../../src/api';
import { useAuth } from '../../src/AuthContext';
import { Series, Episode } from '../../src/types';
import ReportModal from '../../src/ReportModal';
import CommentsSection from '../../src/CommentsSection';

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadSeries();
  }, [id]);

  async function loadSeries() {
    if (!id) return;
    try {
      const [seriesData, episodesData] = await Promise.all([
        seriesAPI.get(id),
        seriesAPI.getEpisodes(id),
      ]);
      setSeries(seriesData);
      setEpisodes(episodesData.data || []);

      // Check user states
      if (user) {
        try {
          const [likeRes, followRes] = await Promise.all([
            likeAPI.checkLike(id),
            followAPI.checkFollow(seriesData.creator_id),
          ]);
          setIsLiked(likeRes.liked);
          setIsFollowing(followRes.is_following);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load series:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleLike = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    try {
      const res = await likeAPI.toggleLike(id!);
      setIsLiked(res.liked);
      if (series) {
        setSeries({ ...series, like_count: series.like_count + (res.liked ? 1 : -1) });
      }
    } catch {}
  };

  const handleWatchlist = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    try {
      if (isInWatchlist) {
        await watchlistAPI.remove(id!);
        setIsInWatchlist(false);
      } else {
        await watchlistAPI.add(id!);
        setIsInWatchlist(true);
      }
    } catch {}
  };

  const handleFollow = async () => {
    if (!user || !series) {
      router.push('/auth');
      return;
    }
    try {
      if (isFollowing) {
        await followAPI.unfollow(series.creator_id);
        setIsFollowing(false);
      } else {
        await followAPI.follow(series.creator_id);
        setIsFollowing(true);
      }
    } catch {}
  };

  const handleTip = async (tipSize: string) => {
    if (!user || !series) {
      router.push('/auth');
      return;
    }
    try {
      const originUrl = 'http://localhost:3000'; // In production, use actual URL
      const res = await paymentsAPI.createTip(tipSize, series.creator_id, originUrl);
      if (res.url) {
        Linking.openURL(res.url);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create tip');
    }
  };

  const showTipOptions = () => {
    Alert.alert(
      'Support ' + series?.creator_name,
      'Choose a tip amount to support this creator',
      [
        { text: '$2', onPress: () => handleTip('small') },
        { text: '$5', onPress: () => handleTip('medium') },
        { text: '$10', onPress: () => handleTip('large') },
        { text: '$25', onPress: () => handleTip('mega') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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

  if (!series) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Series not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[series.creator_avatar_color + '60', series.creator_avatar_color + '20', Colors.bg.default]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={styles.genreBadge}>
              <Text style={styles.genreBadgeText}>{series.genre}</Text>
            </View>
            <Text style={styles.seriesTitle}>{series.title}</Text>
            
            {/* Creator Row */}
            <TouchableOpacity
              onPress={() => router.push(`/creator/${series.creator_id}`)}
              style={styles.creatorRow}
            >
              <LinearGradient colors={[series.creator_avatar_color, series.creator_avatar_color + '60']} style={styles.creatorAvatar}>
                <View style={styles.creatorAvatarInner}>
                  <Text style={[styles.creatorInitial, { color: series.creator_avatar_color }]}>
                    {series.creator_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </LinearGradient>
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorNameText}>{series.creator_name}</Text>
                <Text style={styles.createdDate}>Created {formatDate(series.created_at)}</Text>
              </View>
              <TouchableOpacity
                onPress={handleFollow}
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="eye" size={16} color={Colors.text.muted} />
                <Text style={styles.statText}>{formatCount(series.view_count)} views</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color={Colors.brand.pink} />
                <Text style={styles.statText}>{formatCount(series.like_count)} likes</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="film" size={16} color={Colors.text.muted} />
                <Text style={styles.statText}>{series.episode_count} episodes</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>{series.description}</Text>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {series.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? Colors.brand.pink : Colors.text.secondary} />
                <Text style={styles.actionText}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleWatchlist} style={styles.actionBtn}>
                <Ionicons name={isInWatchlist ? 'bookmark' : 'bookmark-outline'} size={24} color={isInWatchlist ? Colors.brand.cyan : Colors.text.secondary} />
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={showTipOptions} style={styles.actionBtn}>
                <Ionicons name="gift" size={24} color={Colors.brand.warning} />
                <Text style={styles.actionText}>Tip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.actionBtn}>
                <Ionicons name="flag-outline" size={24} color={Colors.brand.error} />
                <Text style={styles.actionText}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Episodes/Chapters Section */}
        <View style={styles.episodesSection}>
          <View style={styles.episodesHeader}>
            <Text style={styles.sectionTitle}>
              {(series as any).content_type === 'novel' ? 'Chapters' : (series as any).content_type === 'movie' ? 'Parts' : 'Episodes'}
            </Text>
            {user?.id === series.creator_id && (
              <TouchableOpacity 
                onPress={() => router.push(`/add-episode?seriesId=${series.id}`)}
                style={styles.addEpisodeBtn}
              >
                <Ionicons name="add" size={20} color={Colors.brand.cyan} />
                <Text style={styles.addEpisodeText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          {episodes.length === 0 ? (
            <View style={styles.noEpisodes}>
              <Ionicons name="film-outline" size={40} color={Colors.text.muted} />
              <Text style={styles.noEpisodesText}>No episodes yet</Text>
            </View>
          ) : (
            episodes.map((ep) => (
              <TouchableOpacity 
                key={ep.id} 
                style={styles.episodeItem} 
                activeOpacity={0.8}
                onPress={() => router.push(`/watch?episodeId=${ep.id}&seriesId=${series.id}`)}
              >
                <View style={styles.episodeLeft}>
                  <Text style={styles.episodeNumber}>
                    {(series as any).content_type === 'novel' ? 'Ch' : 'Ep'} {ep.episode_number}
                  </Text>
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeTitle} numberOfLines={1}>{ep.title}</Text>
                    <Text style={styles.episodeViews}>{formatCount(ep.view_count)} views</Text>
                  </View>
                </View>
                {ep.is_premium && (
                  <View style={styles.premiumTag}>
                    <Ionicons name="star" size={12} color={Colors.brand.warning} />
                  </View>
                )}
                <Ionicons name={(series as any).content_type === 'novel' ? 'book' : 'play-circle'} size={32} color={Colors.brand.cyan} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Comments Section */}
        <CommentsSection contentType="series" contentId={id!} />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="series"
        contentId={id!}
        contentTitle={series?.title || 'Unknown'}
      />
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
  heroSection: { minHeight: 400, paddingTop: 60 },
  heroContent: { padding: Spacing.md },
  genreBadge: { backgroundColor: Colors.brand.pinkDim, paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start', marginBottom: 12 },
  genreBadgeText: { color: Colors.brand.pink, fontSize: 12, fontWeight: '700' },
  seriesTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary, lineHeight: 34, marginBottom: 16 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  creatorAvatar: { width: 44, height: 44, borderRadius: 22, padding: 2 },
  creatorAvatarInner: { flex: 1, borderRadius: 20, backgroundColor: Colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  creatorInitial: { fontSize: 16, fontWeight: '800' },
  creatorInfo: { flex: 1, marginLeft: 10 },
  creatorNameText: { color: Colors.text.primary, fontSize: 15, fontWeight: '700' },
  createdDate: { color: Colors.text.muted, fontSize: 12 },
  followBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.brand.cyan },
  followBtnActive: { backgroundColor: Colors.brand.cyanDim },
  followBtnText: { color: Colors.brand.cyan, fontWeight: '600', fontSize: 13 },
  followBtnTextActive: { color: Colors.brand.cyan },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: Colors.text.muted, fontSize: 13 },
  description: { color: Colors.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: Colors.bg.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  tagText: { color: Colors.text.muted, fontSize: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { color: Colors.text.secondary, fontSize: 12 },
  episodesSection: { padding: Spacing.md },
  episodesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  addEpisodeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.brand.cyanDim },
  addEpisodeText: { color: Colors.brand.cyan, fontSize: 13, fontWeight: '600' },
  noEpisodes: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  noEpisodesText: { color: Colors.text.muted, fontSize: 14 },
  episodeItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  episodeLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  episodeNumber: { color: Colors.brand.cyan, fontSize: 14, fontWeight: '700', width: 50 },
  episodeInfo: { flex: 1 },
  episodeTitle: { color: Colors.text.primary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  episodeViews: { color: Colors.text.muted, fontSize: 12 },
  premiumTag: { marginRight: 10, backgroundColor: Colors.brand.warning + '30', padding: 4, borderRadius: 4 },
});
