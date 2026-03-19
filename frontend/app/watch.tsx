import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Dimensions, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Colors, Spacing, Radius } from '../src/theme';
import { episodeAPI, seriesAPI, progressAPI, commentAPI } from '../src/api';
import { useAuth } from '../src/AuthContext';
import CommentsSection from '../src/CommentsSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WatchScreen() {
  const { episodeId, seriesId } = useLocalSearchParams<{ episodeId: string; seriesId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<Video>(null);
  const [episode, setEpisode] = useState<any>(null);
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, [episodeId, seriesId]);

  async function loadData() {
    try {
      const [epData, seriesData] = await Promise.all([
        episodeAPI.get(episodeId!),
        seriesAPI.get(seriesId!),
      ]);
      setEpisode(epData);
      setSeries(seriesData);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }

  const saveProgress = async (prog: number, completed = false) => {
    if (!user) return;
    try {
      await progressAPI.update({
        series_id: seriesId!,
        episode_id: episodeId!,
        progress: prog,
        completed,
      });
    } catch {}
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      const prog = (status.positionMillis / status.durationMillis) * 100;
      setProgress(prog);
      setIsPlaying(status.isPlaying);
      
      // Save progress every 10%
      if (Math.floor(prog) % 10 === 0) {
        saveProgress(prog, prog >= 95);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${episode?.title}" from ${series?.title} on AnimeWorld!`,
        title: episode?.title,
      });
    } catch {}
  };

  const isNovel = series?.content_type === 'novel';

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

  if (!episode || !series) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Content not found</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Video Player (for series/movies) */}
        {!isNovel && episode.video_url && (
          <View style={styles.videoContainer}>
            {episode.video_url.includes('youtube') || episode.video_url.includes('youtu.be') ? (
              <View style={styles.externalVideoPlaceholder}>
                <Ionicons name="logo-youtube" size={48} color="#FF0000" />
                <Text style={styles.externalVideoText}>Video hosted on YouTube</Text>
                <TouchableOpacity
                  onPress={() => {}}
                  style={styles.watchExternalBtn}
                >
                  <LinearGradient colors={['#FF0000', '#CC0000']} style={styles.watchExternalGradient}>
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text style={styles.watchExternalText}>Watch on YouTube</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: episode.video_url }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
            )}
          </View>
        )}

        {/* Episode/Chapter Info */}
        <View style={styles.infoSection}>
          <View style={styles.episodeHeader}>
            <Text style={styles.episodeNumber}>
              {isNovel ? 'Chapter' : 'Episode'} {episode.episode_number}
            </Text>
            {episode.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color={Colors.brand.warning} />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.episodeTitle}>{episode.title}</Text>
          
          {episode.arc_name && (
            <Text style={styles.arcName}>📚 {episode.arc_name}</Text>
          )}
          
          <TouchableOpacity
            onPress={() => router.push(`/series/${seriesId}`)}
            style={styles.seriesRow}
          >
            <View style={[styles.seriesDot, { backgroundColor: series.creator_avatar_color }]} />
            <Text style={styles.seriesTitle}>{series.title}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
          </TouchableOpacity>

          {episode.description && (
            <Text style={styles.description}>{episode.description}</Text>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="eye" size={16} color={Colors.text.muted} />
              <Text style={styles.statText}>{episode.view_count} views</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="heart" size={16} color={Colors.brand.pink} />
              <Text style={styles.statText}>{episode.like_count} likes</Text>
            </View>
          </View>
        </View>

        {/* Novel Content (for novels) */}
        {isNovel && episode.content_text && (
          <View style={styles.novelContent}>
            <Text style={styles.novelText}>{episode.content_text}</Text>
            <TouchableOpacity
              onPress={() => saveProgress(100, true)}
              style={styles.markCompleteBtn}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.brand.success} />
              <Text style={styles.markCompleteText}>Mark as Read</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comments Section */}
        <CommentsSection contentType="episode" contentId={episodeId!} />

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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  shareBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { flex: 1 },
  externalVideoPlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg.card, gap: 12,
  },
  externalVideoText: { color: Colors.text.muted, fontSize: 14 },
  watchExternalBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  watchExternalGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  watchExternalText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoSection: { padding: Spacing.md },
  episodeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  episodeNumber: { color: Colors.brand.cyan, fontSize: 13, fontWeight: '700' },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.brand.warning + '20',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full,
  },
  premiumText: { color: Colors.brand.warning, fontSize: 11, fontWeight: '700' },
  episodeTitle: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, lineHeight: 28, marginBottom: 8 },
  arcName: { color: Colors.text.secondary, fontSize: 13, marginBottom: 8 },
  seriesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  seriesDot: { width: 8, height: 8, borderRadius: 4 },
  seriesTitle: { flex: 1, color: Colors.text.secondary, fontSize: 14 },
  description: { color: Colors.text.muted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 20 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: Colors.text.muted, fontSize: 13 },
  novelContent: { padding: Spacing.md, backgroundColor: Colors.bg.surface, marginHorizontal: Spacing.md, borderRadius: Radius.md },
  novelText: { color: Colors.text.primary, fontSize: 16, lineHeight: 28 },
  markCompleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.brand.success + '20',
    borderRadius: Radius.md,
  },
  markCompleteText: { color: Colors.brand.success, fontWeight: '600', fontSize: 14 },
});
