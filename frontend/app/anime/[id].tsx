import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { animeAPI, watchlistAPI } from '../../src/api';
import { useAuth } from '../../src/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AnimeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'details'>('episodes');

  useEffect(() => {
    if (id) loadAnimeData(parseInt(id));
  }, [id]);

  async function loadAnimeData(animeId: number) {
    try {
      const [detailRes, episodesRes] = await Promise.all([
        animeAPI.getDetail(animeId),
        animeAPI.getEpisodes(animeId),
      ]);
      setAnime(detailRes.data);
      setEpisodes(episodesRes.data || []);

      if (user) {
        try {
          const wlCheck = await watchlistAPI.check(animeId);
          setInWatchlist(wlCheck.in_watchlist);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load anime:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleWatchlist() {
    if (!user) {
      router.push('/auth');
      return;
    }
    try {
      if (inWatchlist) {
        await watchlistAPI.remove(anime.mal_id);
        setInWatchlist(false);
      } else {
        await watchlistAPI.add({
          anime_id: anime.mal_id,
          title: anime.title,
          image_url: anime.images?.jpg?.image_url,
          score: anime.score,
          episodes: anime.episodes,
          status: anime.status,
        });
        setInWatchlist(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update watchlist');
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brand.cyan} />
      </View>
    );
  }

  if (!anime) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Anime not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const genres = anime.genres?.map((g: any) => g.name).join(', ') || 'N/A';
  const studios = anime.studios?.map((s: any) => s.name).join(', ') || 'N/A';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          <LinearGradient colors={['rgba(9,9,11,0.3)', 'rgba(9,9,11,0.7)', '#09090B']} style={styles.heroGradient} />
          <SafeAreaView style={styles.heroNav} edges={['top']}>
            <TouchableOpacity testID="detail-back-btn" onPress={() => router.back()} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity testID="detail-share-btn" style={styles.navBtn}>
              <Ionicons name="share-outline" size={22} color={Colors.text.primary} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{anime.title}</Text>
          <View style={styles.metaRow}>
            {anime.score && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color={Colors.brand.warning} />
                <Text style={styles.metaText}>{anime.score}</Text>
              </View>
            )}
            {anime.year && <Text style={styles.metaDot}>·</Text>}
            {anime.year && <Text style={styles.metaText}>{anime.year}</Text>}
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{anime.type || 'TV'}</Text>
            {anime.episodes && <Text style={styles.metaDot}>·</Text>}
            {anime.episodes && <Text style={styles.metaText}>{anime.episodes} eps</Text>}
          </View>

          {/* Genre Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
            {anime.genres?.map((genre: any) => (
              <View key={genre.mal_id} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre.name}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity testID="watchlist-toggle-btn" onPress={toggleWatchlist} style={styles.actionBtn}>
              <Ionicons
                name={inWatchlist ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={inWatchlist ? Colors.brand.pink : Colors.text.secondary}
              />
              <Text style={[styles.actionText, inWatchlist && { color: Colors.brand.pink }]}>
                {inWatchlist ? 'In List' : 'My List'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Synopsis */}
          <Text style={styles.synopsis}>{anime.synopsis || 'No synopsis available.'}</Text>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              testID="episodes-tab"
              onPress={() => setActiveTab('episodes')}
              style={[styles.tab, activeTab === 'episodes' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'episodes' && styles.tabTextActive]}>Episodes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="details-tab"
              onPress={() => setActiveTab('details')}
              style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>Details</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'episodes' ? (
            episodes.length > 0 ? (
              episodes.map((ep: any, idx: number) => (
                <TouchableOpacity
                  key={ep.mal_id || idx}
                  testID={`episode-item-${idx}`}
                  onPress={() => router.push(`/episode/${anime.mal_id}?ep=${ep.mal_id || idx + 1}&title=${encodeURIComponent(ep.title || `Episode ${idx + 1}`)}&anime_title=${encodeURIComponent(anime.title)}&image=${encodeURIComponent(imageUrl)}`)}
                  style={styles.episodeItem}
                >
                  <View style={styles.episodeThumb}>
                    <Image source={{ uri: imageUrl }} style={styles.episodeImage} />
                    <View style={styles.playOverlay}>
                      <Ionicons name="play" size={20} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeNumber}>E{ep.mal_id || idx + 1}</Text>
                    <Text style={styles.episodeTitle} numberOfLines={1}>
                      {ep.title || `Episode ${idx + 1}`}
                    </Text>
                    {ep.aired && (
                      <Text style={styles.episodeDate}>{new Date(ep.aired).toLocaleDateString()}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noEpisodes}>
                <Ionicons name="film-outline" size={40} color={Colors.text.muted} />
                <Text style={styles.noEpisodesText}>No episodes available yet</Text>
              </View>
            )
          ) : (
            <View style={styles.detailsContent}>
              <DetailRow label="Status" value={anime.status || 'N/A'} />
              <DetailRow label="Type" value={anime.type || 'N/A'} />
              <DetailRow label="Episodes" value={anime.episodes?.toString() || 'N/A'} />
              <DetailRow label="Duration" value={anime.duration || 'N/A'} />
              <DetailRow label="Rating" value={anime.rating || 'N/A'} />
              <DetailRow label="Studios" value={studios} />
              <DetailRow label="Genres" value={genres} />
              <DetailRow label="Source" value={anime.source || 'N/A'} />
              {anime.aired?.string && <DetailRow label="Aired" value={anime.aired.string} />}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg.default, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 18, color: Colors.text.secondary },
  backLink: { fontSize: 16, color: Colors.brand.cyan, fontWeight: '600' },
  heroContainer: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  heroNav: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  infoSection: { paddingHorizontal: Spacing.md, marginTop: -40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text.primary, lineHeight: 32 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 14, color: Colors.text.secondary, fontWeight: '500' },
  metaDot: { fontSize: 14, color: Colors.text.muted },
  genreScroll: { paddingVertical: Spacing.md, gap: 8 },
  genreTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.brand.cyanDim, borderWidth: 1, borderColor: 'rgba(0,240,255,0.3)' },
  genreText: { fontSize: 12, color: Colors.brand.cyan, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 16, paddingVertical: Spacing.sm },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500' },
  synopsis: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22, marginVertical: Spacing.md },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.md },
  tab: { paddingVertical: 12, paddingHorizontal: 20 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.brand.cyan },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.text.muted },
  tabTextActive: { color: Colors.brand.cyan },
  episodeItem: {
    flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: Colors.border, gap: 12, alignItems: 'center',
  },
  episodeThumb: { width: 120, height: 68, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  episodeImage: { width: '100%', height: '100%' },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  episodeInfo: { flex: 1 },
  episodeNumber: { fontSize: 12, color: Colors.brand.cyan, fontWeight: '700', marginBottom: 2 },
  episodeTitle: { fontSize: 14, color: Colors.text.primary, fontWeight: '600' },
  episodeDate: { fontSize: 12, color: Colors.text.muted, marginTop: 4 },
  noEpisodes: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  noEpisodesText: { fontSize: 14, color: Colors.text.muted },
  detailsContent: { gap: 2 },
  detailRow: {
    flexDirection: 'row', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailLabel: { width: 100, fontSize: 14, color: Colors.text.muted, fontWeight: '600' },
  detailValue: { flex: 1, fontSize: 14, color: Colors.text.primary },
});
