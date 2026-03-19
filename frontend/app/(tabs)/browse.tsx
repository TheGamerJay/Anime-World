import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { seriesAPI, feedAPI } from '../../src/api';
import { Series } from '../../src/types';

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function SeriesListItem({ item, onPress }: { item: Series; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.listItem} activeOpacity={0.8}>
      <LinearGradient
        colors={[item.creator_avatar_color + '40', Colors.bg.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.listItemGradient}
      />
      <View style={styles.listItemContent}>
        <View style={styles.listItemLeft}>
          <Text style={styles.listItemTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.listItemMeta}>
            <View style={[styles.creatorDot, { backgroundColor: item.creator_avatar_color }]} />
            <Text style={styles.listItemCreator}>{item.creator_name}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.listItemGenre}>{item.genre}</Text>
          </View>
          <View style={styles.listItemStats}>
            <Ionicons name="eye-outline" size={12} color={Colors.text.muted} />
            <Text style={styles.statText}>{formatCount(item.view_count)}</Text>
            <Ionicons name="heart" size={12} color={Colors.brand.pink} style={{ marginLeft: 8 }} />
            <Text style={styles.statText}>{formatCount(item.like_count)}</Text>
            <Ionicons name="film-outline" size={12} color={Colors.text.muted} style={{ marginLeft: 8 }} />
            <Text style={styles.statText}>{item.episode_count} eps</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const [series, setSeries] = useState<Series[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Series[] | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [seriesRes, genresRes] = await Promise.all([
        seriesAPI.getAll(selectedGenre, sortBy),
        feedAPI.getGenres(),
      ]);
      setSeries(seriesRes.data || []);
      setGenres(genresRes.genres || []);
    } catch (err) {
      console.error('Failed to load browse data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGenre, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const res = await seriesAPI.search(searchQuery);
          setSearchResults(res.data || []);
        } catch {
          setSearchResults([]);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToSeries = (id: string) => {
    router.push(`/series/${id}`);
  };

  const displayData = searchResults !== null ? searchResults : series;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brand.cyan} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Browse</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search series..."
          placeholderTextColor={Colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Genre Filter */}
      {searchResults === null && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreList}
        >
          <TouchableOpacity
            onPress={() => setSelectedGenre('all')}
            style={[styles.genreChip, selectedGenre === 'all' && styles.genreChipActive]}
          >
            <Text style={[styles.genreChipText, selectedGenre === 'all' && styles.genreChipTextActive]}>All</Text>
          </TouchableOpacity>
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre}
              onPress={() => setSelectedGenre(genre)}
              style={[styles.genreChip, selectedGenre === genre && styles.genreChipActive]}
            >
              <Text style={[styles.genreChipText, selectedGenre === genre && styles.genreChipTextActive]}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Sort Options */}
      {searchResults === null && (
        <View style={styles.sortRow}>
          {['popular', 'latest', 'liked'].map((sort) => (
            <TouchableOpacity
              key={sort}
              onPress={() => setSortBy(sort)}
              style={[styles.sortBtn, sortBy === sort && styles.sortBtnActive]}
            >
              <Text style={[styles.sortText, sortBy === sort && styles.sortTextActive]}>
                {sort === 'popular' ? 'Most Popular' : sort === 'latest' ? 'Latest' : 'Most Liked'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.cyan} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>
              {searchResults !== null ? 'No results found' : 'No series found'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SeriesListItem item={item} onPress={() => navigateToSeries(item.id)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, paddingHorizontal: 12,
    paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text.primary, fontSize: 16 },
  genreList: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8 },
  genreChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.border,
  },
  genreChipActive: { backgroundColor: Colors.brand.cyanDim, borderColor: Colors.brand.cyan },
  genreChipText: { color: Colors.text.secondary, fontSize: 13, fontWeight: '600' },
  genreChipTextActive: { color: Colors.brand.cyan },
  sortRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 8, marginBottom: Spacing.sm },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  sortBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.brand.pink },
  sortText: { color: Colors.text.muted, fontSize: 13, fontWeight: '600' },
  sortTextActive: { color: Colors.brand.pink },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  listItem: {
    marginBottom: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  listItemGradient: { ...StyleSheet.absoluteFillObject },
  listItemContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md,
  },
  listItemLeft: { flex: 1, marginRight: Spacing.sm },
  listItemTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  listItemMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  creatorDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  listItemCreator: { color: Colors.text.secondary, fontSize: 12 },
  metaDot: { color: Colors.text.muted, marginHorizontal: 6 },
  listItemGenre: { color: Colors.brand.pink, fontSize: 12, fontWeight: '600' },
  listItemStats: { flexDirection: 'row', alignItems: 'center' },
  statText: { color: Colors.text.muted, fontSize: 11, marginLeft: 3 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.text.muted, fontSize: 16 },
});
