import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  Image, ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { animeAPI } from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - 12) / 2;

const GENRE_CHIPS = [
  { id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }, { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' }, { id: 10, name: 'Fantasy' }, { id: 14, name: 'Horror' },
  { id: 22, name: 'Romance' }, { id: 24, name: 'Sci-Fi' }, { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' }, { id: 37, name: 'Supernatural' }, { id: 7, name: 'Mystery' },
];

export default function BrowseScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchAnime = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await animeAPI.search(searchQuery);
      setResults(res.data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByGenre = useCallback(async (genreName: string) => {
    setLoading(true);
    setHasSearched(true);
    setSelectedGenre(genreName);
    try {
      const res = await animeAPI.search(genreName);
      setResults(res.data || []);
    } catch (err) {
      console.error('Genre search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderAnimeItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.jpg?.image_url;
    return (
      <TouchableOpacity
        testID={`browse-card-${item.mal_id}`}
        onPress={() => router.push(`/anime/${item.mal_id}`)}
        activeOpacity={0.8}
        style={styles.gridCard}
      >
        <Image source={{ uri: imageUrl }} style={styles.gridImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gridGradient} />
        {item.score && (
          <View style={styles.scoreTag}>
            <Ionicons name="star" size={10} color={Colors.brand.warning} />
            <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
          </View>
        )}
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
          {item.episodes && (
            <Text style={styles.gridEpisodes}>{item.episodes} eps</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Browse</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.text.muted} />
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="Search anime..."
            placeholderTextColor={Colors.text.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => searchAnime(query)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
              <Ionicons name="close-circle" size={20} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Genre Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
        {GENRE_CHIPS.map((genre) => (
          <TouchableOpacity
            key={genre.id}
            testID={`genre-chip-${genre.id}`}
            onPress={() => searchByGenre(genre.name)}
            style={[styles.genreChip, selectedGenre === genre.name && styles.genreChipActive]}
          >
            <Text style={[styles.genreChipText, selectedGenre === genre.name && styles.genreChipTextActive]}>
              {genre.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.brand.cyan} />
        </View>
      ) : !hasSearched ? (
        <View style={styles.centerContent}>
          <Ionicons name="search" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyText}>Search for your favorite anime</Text>
          <Text style={styles.emptySubtext}>Or tap a genre to explore</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="sad-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item) => `browse-${item.mal_id}`}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderAnimeItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  headerSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.md },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 48,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  searchInput: { flex: 1, color: Colors.text.primary, fontSize: 16 },
  genreRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: 8 },
  genreChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border,
  },
  genreChipActive: { borderColor: Colors.brand.cyan, backgroundColor: Colors.brand.cyanDim },
  genreChipText: { color: Colors.text.secondary, fontWeight: '600', fontSize: 13 },
  genreChipTextActive: { color: Colors.brand.cyan },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text.secondary },
  emptySubtext: { fontSize: 14, color: Colors.text.muted },
  gridContainer: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  gridRow: { gap: 12, marginBottom: 12 },
  gridCard: { width: CARD_WIDTH, height: CARD_WIDTH * 1.5, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  scoreTag: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full, gap: 3,
  },
  scoreText: { color: Colors.brand.warning, fontWeight: '700', fontSize: 11 },
  gridInfo: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  gridTitle: { color: Colors.text.primary, fontWeight: '600', fontSize: 13, lineHeight: 18 },
  gridEpisodes: { color: Colors.text.muted, fontSize: 11, marginTop: 2 },
});
