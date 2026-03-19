import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { feedAPI, creatorAPI, seedAPI } from '../../src/api';
import { useAuth } from '../../src/AuthContext';
import { Series, Creator } from '../../src/types';

function HeroSection({ series, onPress, isWide }: { series: Series | null; onPress: () => void; isWide: boolean }) {
  if (!series) return null;
  const heroHeight = isWide ? 500 : undefined;

  return (
    <TouchableOpacity testID="hero-banner" onPress={onPress} activeOpacity={0.9} style={[styles.heroContainer, isWide && { height: heroHeight }]}>
      <LinearGradient
        colors={[series.creator_avatar_color + '40', Colors.bg.default]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.heroContent, isWide && styles.heroContentWide]}>
        <View style={styles.heroBadge}>
          <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badgeGradient}>
            <Text style={styles.badgeText}>FEATURED</Text>
          </LinearGradient>
        </View>
        <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]} numberOfLines={2}>{series.title}</Text>
        <View style={styles.creatorRow}>
          <View style={[styles.creatorDot, { backgroundColor: series.creator_avatar_color }]} />
          <Text style={styles.creatorName}>{series.creator_name}</Text>
          <Text style={styles.statDot}>•</Text>
          <Text style={styles.genreText}>{series.genre}</Text>
        </View>
        <Text style={[styles.heroSynopsis, isWide && styles.heroSynopsisWide]} numberOfLines={isWide ? 3 : 2}>
          {series.description}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color={Colors.text.muted} />
            <Text style={styles.statText}>{formatCount(series.view_count)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart" size={14} color={Colors.brand.pink} />
            <Text style={styles.statText}>{formatCount(series.like_count)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="film-outline" size={14} color={Colors.text.muted} />
            <Text style={styles.statText}>{series.episode_count} eps</Text>
          </View>
        </View>
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

function SeriesCard({ item, onPress, isWide }: { item: Series; onPress: () => void; isWide: boolean }) {
  const cardW = isWide ? 180 : 140;
  const cardH = isWide ? 200 : 170;
  return (
    <TouchableOpacity testID={`series-card-${item.id}`} onPress={onPress} activeOpacity={0.8} style={[styles.seriesCard, { width: cardW, height: cardH }]}>
      <LinearGradient
        colors={[item.creator_avatar_color + '60', item.creator_avatar_color + '20', Colors.bg.card]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardGenreTag}>
          <Text style={styles.cardGenreText}>{item.genre}</Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardCreatorRow}>
            <View style={[styles.miniDot, { backgroundColor: item.creator_avatar_color }]} />
            <Text style={styles.cardCreator} numberOfLines={1}>{item.creator_name}</Text>
          </View>
          <View style={styles.cardStats}>
            <Ionicons name="eye-outline" size={12} color={Colors.text.muted} />
            <Text style={styles.cardStatText}>{formatCount(item.view_count)}</Text>
            <Ionicons name="heart" size={12} color={Colors.brand.pink} style={{ marginLeft: 6 }} />
            <Text style={styles.cardStatText}>{formatCount(item.like_count)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CreatorCard({ creator, onPress }: { creator: Creator; onPress: () => void }) {
  const initial = creator.username.charAt(0).toUpperCase();
  return (
    <TouchableOpacity onPress={onPress} style={styles.creatorCard} activeOpacity={0.8}>
      <LinearGradient colors={[creator.avatar_color, creator.avatar_color + '60']} style={styles.creatorAvatar}>
        <View style={styles.creatorAvatarInner}>
          <Text style={[styles.creatorInitial, { color: creator.avatar_color }]}>{initial}</Text>
        </View>
      </LinearGradient>
      <Text style={styles.creatorCardName} numberOfLines={1}>{creator.username}</Text>
      <Text style={styles.creatorFollowers}>{formatCount(creator.follower_count)} followers</Text>
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

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const [featured, setFeatured] = useState<Series[]>([]);
  const [trending, setTrending] = useState<Series[]>([]);
  const [latest, setLatest] = useState<Series[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Try to seed data first (only seeds if empty)
      try { await seedAPI.seed(); } catch {}

      const [featuredRes, trendingRes, latestRes, creatorsRes] = await Promise.all([
        feedAPI.getFeatured(),
        feedAPI.getTrending(),
        feedAPI.getLatest(),
        creatorAPI.getTopCreators(),
      ]);
      setFeatured(featuredRes.data || []);
      setTrending(trendingRes.data || []);
      setLatest(latestRes.data || []);
      setTopCreators(creatorsRes.data || []);
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

  const navigateToSeries = (id: string) => {
    router.push(`/series/${id}`);
  };

  const navigateToCreator = (id: string) => {
    router.push(`/creator/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brand.cyan} />
      </View>
    );
  }

  const heroSeries = featured[0] || trending[0] || null;

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
              {user.is_creator && (
                <View style={styles.creatorBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.brand.success} />
                </View>
              )}
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
          <HeroSection series={heroSeries} onPress={() => heroSeries && navigateToSeries(heroSeries.id)} isWide={isWide} />
        </View>

        {/* Content area with max width on desktop */}
        <View style={isWide ? styles.contentWrapper : undefined}>
          {/* Top Creators */}
          {topCreators.length > 0 && (
            <>
              <SectionHeader title="Top Creators" />
              <FlatList
                data={topCreators.slice(0, 10)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `creator-${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <CreatorCard creator={item} onPress={() => navigateToCreator(item.id)} />
                )}
              />
            </>
          )}

          {/* Trending */}
          <SectionHeader title="Trending Now" onSeeAll={() => router.push('/browse')} />
          <FlatList
            data={trending.slice(0, 20)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `trending-${item.id}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <SeriesCard item={item} onPress={() => navigateToSeries(item.id)} isWide={isWide} />
            )}
          />

          {/* Latest Releases */}
          <SectionHeader title="Latest Releases" onSeeAll={() => router.push('/browse')} />
          <FlatList
            data={latest.slice(0, 20)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `latest-${item.id}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <SeriesCard item={item} onPress={() => navigateToSeries(item.id)} isWide={isWide} />
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
  creatorBadge: { marginLeft: -4 },
  heroWrapper: { maxHeight: 400, overflow: 'hidden' },
  heroContainer: { width: '100%', minHeight: 300, position: 'relative', paddingTop: Spacing.xl },
  heroContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  heroContentWide: { paddingHorizontal: 48, maxWidth: '60%' },
  heroBadge: { marginBottom: Spacing.sm },
  badgeGradient: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start' },
  badgeText: { color: '#000', fontWeight: '800', fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.5, lineHeight: 34, marginBottom: 8 },
  heroTitleWide: { fontSize: 38, lineHeight: 46 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  creatorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  creatorName: { color: Colors.text.secondary, fontSize: 14, fontWeight: '600' },
  statDot: { color: Colors.text.muted, marginHorizontal: 6 },
  genreText: { color: Colors.brand.pink, fontSize: 13, fontWeight: '600' },
  heroSynopsis: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20, marginBottom: Spacing.sm },
  heroSynopsisWide: { fontSize: 16, lineHeight: 24 },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: Spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: Colors.text.muted, fontSize: 13 },
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
  // Series Card
  seriesCard: { borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  cardContent: { flex: 1, justifyContent: 'space-between', padding: 10 },
  cardGenreTag: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  cardGenreText: { color: Colors.brand.cyan, fontSize: 10, fontWeight: '700' },
  cardBottom: { marginTop: 'auto' },
  cardTitle: { color: Colors.text.primary, fontWeight: '700', fontSize: 13, lineHeight: 17, marginBottom: 4 },
  cardCreatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  miniDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  cardCreator: { color: Colors.text.muted, fontSize: 11, flex: 1 },
  cardStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardStatText: { color: Colors.text.muted, fontSize: 11 },
  // Creator Card
  creatorCard: { alignItems: 'center', width: 80, marginRight: 4 },
  creatorAvatar: { width: 60, height: 60, borderRadius: 30, padding: 2 },
  creatorAvatarInner: { flex: 1, borderRadius: 28, backgroundColor: Colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  creatorInitial: { fontSize: 22, fontWeight: '800' },
  creatorCardName: { color: Colors.text.primary, fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  creatorFollowers: { color: Colors.text.muted, fontSize: 10, marginTop: 2 },
});
