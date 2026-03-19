import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  FlatList, ActivityIndicator, Dimensions, RefreshControl, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { animeAPI } from '../../src/api';
import { useAuth } from '../../src/AuthContext';

interface AnimeItem {
  mal_id: number;
  title: string;
  images: any;
  score?: number;
  synopsis?: string;
  episodes?: number;
  status?: string;
  genres?: any[];
}

function HeroSection({ anime, onPress, isWide }: { anime: AnimeItem | null; onPress: () => void; isWide: boolean }) {
  if (!anime) return null;
  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const heroHeight = isWide ? 500 : undefined;

  return (
    <TouchableOpacity testID="hero-banner" onPress={onPress} activeOpacity={0.9} style={[styles.heroContainer, isWide && { height: heroHeight }]}>
      <Image source={{ uri: imageUrl }} style={[styles.heroImage, isWide && { height: heroHeight }]} resizeMode={isWide ? 'cover' : 'cover'} />
      <LinearGradient
        colors={['transparent', 'rgba(9,9,11,0.6)', '#09090B']}
        style={styles.heroGradient}
      />
      <View style={[styles.heroContent, isWide && styles.heroContentWide]}>
        <View style={styles.heroBadge}>
          <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badgeGradient}>
            <Text style={styles.badgeText}>FEATURED</Text>
          </LinearGradient>
        </View>
        <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]} numberOfLines={2}>{anime.title}</Text>
        <Text style={[styles.heroSynopsis, isWide && styles.heroSynopsisWide]} numberOfLines={isWide ? 3 : 2}>{anime.synopsis || 'An exciting anime series awaits you!'}</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity testID="hero-watch-btn" onPress={onPress} style={styles.watchBtn}>
            <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.watchBtnGradient}>
              <Ionicons name="play" size={18} color="#000" />
              <Text style={styles.watchBtnText}>Watch Now</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity testID="hero-info-btn" onPress={onPress} style={styles.infoBtn}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.text.primary} />
            <Text style={styles.infoBtnText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AnimeCard({ item, onPress, isWide }: { item: AnimeItem; onPress: () => void; isWide: boolean }) {
  const imageUrl = item.images?.jpg?.image_url;
  const cardW = isWide ? 180 : 140;
  const cardH = isWide ? 270 : 210;
  return (
    <TouchableOpacity testID={`anime-card-${item.mal_id}`} onPress={onPress} activeOpacity={0.8} style={[styles.animeCard, { width: cardW, height: cardH }]}>
      <Image source={{ uri: imageUrl }} style={styles.animeCardImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cardGradient} />
      {item.score && (
        <View style={styles.scoreTag}>
          <Ionicons name="star" size={10} color={Colors.brand.warning} />
          <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
        </View>
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const [trending, setTrending] = useState<AnimeItem[]>([]);
  const [popular, setPopular] = useState<AnimeItem[]>([]);
  const [upcoming, setUpcoming] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [trendingRes, popularRes, upcomingRes] = await Promise.all([
        animeAPI.getTop('airing', 1),
        animeAPI.getTop('bypopularity', 1),
        animeAPI.getTop('upcoming', 1),
      ]);
      setTrending(trendingRes.data || []);
      setPopular(popularRes.data || []);
      setUpcoming(upcomingRes.data || []);
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToAnime = (id: number) => {
    router.push(`/anime/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brand.cyan} />
      </View>
    );
  }

  const heroAnime = trending[0] || null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.cyan} />}
      >
        {/* Header */}
        <View style={[styles.header, isWide && styles.headerWide]}>
          <Text style={styles.logo}>ANIME<Text style={styles.logoPink}>WORLD</Text></Text>
          {user ? (
            <View style={styles.userBadge}>
              <Ionicons name="person-circle" size={28} color={Colors.brand.cyan} />
              <Text style={styles.userNameText}>{user.username}</Text>
            </View>
          ) : (
            <View style={styles.authButtons}>
              <TouchableOpacity testID="login-btn" onPress={() => router.push('/auth')} style={styles.loginHeaderBtn}>
                <Text style={styles.loginHeaderText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="signup-btn" onPress={() => router.push('/auth')} style={styles.signupHeaderBtn}>
                <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signupGradient}>
                  <Text style={styles.signupHeaderText}>{isWide ? 'Create Account' : 'Sign Up'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Hero */}
        <View style={isWide ? styles.heroWrapper : undefined}>
          <HeroSection anime={heroAnime} onPress={() => heroAnime && navigateToAnime(heroAnime.mal_id)} isWide={isWide} />
        </View>

        {/* Content area with max width on desktop */}
        <View style={isWide ? styles.contentWrapper : undefined}>
          {/* Trending Now */}
          <SectionHeader title="Trending Now" />
          <FlatList
            data={trending.slice(0, 20)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `trending-${item.mal_id}-${index}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <AnimeCard item={item} onPress={() => navigateToAnime(item.mal_id)} isWide={isWide} />
            )}
          />

          {/* Most Popular */}
          <SectionHeader title="Most Popular" />
          <FlatList
            data={popular.slice(0, 20)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `popular-${item.mal_id}-${index}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <AnimeCard item={item} onPress={() => navigateToAnime(item.mal_id)} isWide={isWide} />
            )}
          />

          {/* Coming Soon */}
          <SectionHeader title="Coming Soon" />
          <FlatList
            data={upcoming.slice(0, 20)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `upcoming-${item.mal_id}-${index}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <AnimeCard item={item} onPress={() => navigateToAnime(item.mal_id)} isWide={isWide} />
            )}
          />

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  scrollContentWide: { alignItems: 'stretch' },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  headerWide: { paddingHorizontal: 48, paddingVertical: 16 },
  logo: { fontSize: 28, fontWeight: '800', color: Colors.brand.cyan, letterSpacing: 2 },
  logoPink: { color: Colors.brand.pink },
  authButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginHeaderBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.brand.cyan,
  },
  loginHeaderText: { color: Colors.brand.cyan, fontWeight: '600', fontSize: 13 },
  signupHeaderBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  signupGradient: { paddingHorizontal: 18, paddingVertical: 9 },
  signupHeaderText: { color: '#000', fontWeight: '700', fontSize: 13 },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userNameText: { color: Colors.brand.cyan, fontWeight: '600', fontSize: 14 },
  heroWrapper: { maxHeight: 500, overflow: 'hidden' },
  heroContainer: { width: '100%', aspectRatio: 0.9, position: 'relative', maxHeight: 500 },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  heroContent: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  heroContentWide: { left: 48, right: '40%', bottom: 40 },
  heroBadge: { marginBottom: Spacing.sm },
  badgeGradient: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start' },
  badgeText: { color: '#000', fontWeight: '800', fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.5, lineHeight: 34, marginBottom: 6 },
  heroTitleWide: { fontSize: 38, lineHeight: 46 },
  heroSynopsis: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20, marginBottom: Spacing.md },
  heroSynopsisWide: { fontSize: 16, lineHeight: 24 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  watchBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  watchBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
  watchBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  infoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full },
  infoBtnText: { color: Colors.text.primary, fontWeight: '600', fontSize: 14 },
  contentWrapper: { paddingHorizontal: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  seeAllText: { fontSize: 14, color: Colors.brand.cyan, fontWeight: '600' },
  horizontalList: { paddingHorizontal: Spacing.md, gap: 12 },
  animeCard: { borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  animeCardImage: { width: '100%', height: '100%' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  scoreTag: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full, gap: 3,
  },
  scoreText: { color: Colors.brand.warning, fontWeight: '700', fontSize: 11 },
  cardTitle: { position: 'absolute', bottom: 8, left: 8, right: 8, color: Colors.text.primary, fontWeight: '600', fontSize: 12, lineHeight: 16 },
});
