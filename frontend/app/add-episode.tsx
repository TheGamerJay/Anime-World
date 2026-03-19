import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { episodeAPI, seriesAPI } from '../src/api';
import { useAuth } from '../src/AuthContext';

export default function AddEpisodeScreen() {
  const router = useRouter();
  const { seriesId } = useLocalSearchParams<{ seriesId: string }>();
  const { user } = useAuth();
  const [series, setSeries] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('1');
  const [arcName, setArcName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [contentText, setContentText] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(true);

  useEffect(() => {
    loadSeries();
  }, [seriesId]);

  async function loadSeries() {
    if (!seriesId) return;
    try {
      const data = await seriesAPI.get(seriesId);
      setSeries(data);
      setEpisodeNumber(String((data.episode_count || 0) + 1));
    } catch (err) {
      Alert.alert('Error', 'Failed to load series');
      router.back();
    } finally {
      setLoadingSeries(false);
    }
  }

  const getContentLabel = () => {
    if (!series) return 'Episode';
    switch (series.content_type) {
      case 'novel': return 'Chapter';
      case 'movie': return 'Part';
      default: return 'Episode';
    }
  };

  const getContentEmoji = () => {
    if (!series) return '📺';
    switch (series.content_type) {
      case 'novel': return '📖';
      case 'movie': return '🎬';
      default: return '📺';
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Oops! 🙈', `Please enter a ${getContentLabel().toLowerCase()} title`);
      return;
    }
    if (series?.content_type === 'novel' && !contentText.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter the chapter content');
      return;
    }
    if (series?.content_type !== 'novel' && !videoUrl.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter a video URL');
      return;
    }

    setLoading(true);
    try {
      await episodeAPI.create({
        series_id: seriesId,
        title: title.trim(),
        description: description.trim(),
        episode_number: parseInt(episodeNumber) || 1,
        arc_name: arcName.trim() || null,
        video_url: videoUrl.trim(),
        content_text: contentText.trim(),
        is_premium: isPremium,
      });
      Alert.alert('Success! 🎉', `${getContentLabel()} added successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Oops! 🙈', err.message || `Failed to add ${getContentLabel().toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSeries) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.cyan} />
        </View>
      </SafeAreaView>
    );
  }

  if (!series || series.creator_id !== user?.id) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorEmoji}>🙈</Text>
          <Text style={styles.errorText}>You don't have permission to edit this content</Text>
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add {getContentLabel()} {getContentEmoji()}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Series Info */}
          <View style={styles.seriesInfo}>
            <Text style={styles.seriesTitle}>{series.title}</Text>
            <Text style={styles.seriesType}>{series.content_type} • {series.genre}</Text>
          </View>

          <View style={styles.form}>
            {/* Episode Number & Arc */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{getContentLabel()} # *</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputEmoji}>#️⃣</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor={Colors.text.muted}
                    value={episodeNumber}
                    onChangeText={setEpisodeNumber}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
                <Text style={styles.label}>Arc / Season</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputEmoji}>📚</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Season 1, Arc 1"
                    placeholderTextColor={Colors.text.muted}
                    value={arcName}
                    onChangeText={setArcName}
                  />
                </View>
              </View>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{getContentLabel()} Title *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputEmoji}>✏️</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${getContentLabel().toLowerCase()} title`}
                  placeholderTextColor={Colors.text.muted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textAreaSmall]}
                  placeholder="Brief description of this part..."
                  placeholderTextColor={Colors.text.muted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                  maxLength={500}
                />
              </View>
            </View>

            {/* Video URL (for series/movies) */}
            {series.content_type !== 'novel' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Video URL *</Text>
                <Text style={styles.labelHint}>YouTube, Vimeo, or direct video link</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputEmoji}>🎥</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://youtube.com/watch?v=..."
                    placeholderTextColor={Colors.text.muted}
                    value={videoUrl}
                    onChangeText={setVideoUrl}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {/* Chapter Content (for novels) */}
            {series.content_type === 'novel' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Chapter Content *</Text>
                <Text style={styles.labelHint}>Write your chapter here</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={[styles.input, styles.textAreaLarge]}
                    placeholder="Once upon a time..."
                    placeholderTextColor={Colors.text.muted}
                    value={contentText}
                    onChangeText={setContentText}
                    multiline
                    numberOfLines={10}
                  />
                </View>
                <Text style={styles.charCount}>{contentText.length} characters</Text>
              </View>
            )}

            {/* Premium Toggle */}
            <TouchableOpacity
              onPress={() => setIsPremium(!isPremium)}
              style={[styles.premiumToggle, isPremium && styles.premiumToggleActive]}
            >
              <View style={styles.premiumLeft}>
                <Text style={styles.premiumEmoji}>⭐</Text>
                <View>
                  <Text style={styles.premiumLabel}>Premium Content</Text>
                  <Text style={styles.premiumHint}>Only premium subscribers can access</Text>
                </View>
              </View>
              <View style={[styles.toggle, isPremium && styles.toggleActive]}>
                <View style={[styles.toggleDot, isPremium && styles.toggleDotActive]} />
              </View>
            </TouchableOpacity>

            {/* Create Button */}
            <TouchableOpacity onPress={handleCreate} disabled={loading} style={styles.createBtn}>
              <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGradient}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text style={styles.createBtnEmoji}>{getContentEmoji()}</Text>
                    <Text style={styles.createBtnText}>Add {getContentLabel()}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorEmoji: { fontSize: 64, marginBottom: 16 },
  errorText: { color: Colors.text.muted, fontSize: 16, textAlign: 'center', marginBottom: 16 },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.bg.surface },
  backButtonText: { color: Colors.brand.cyan, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  seriesInfo: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.bg.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  seriesTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  seriesType: { fontSize: 12, color: Colors.text.muted, marginTop: 2, textTransform: 'capitalize' },
  form: { padding: Spacing.md },
  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  labelHint: { fontSize: 12, color: Colors.text.muted, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.border,
  },
  textAreaContainer: { alignItems: 'flex-start', paddingVertical: 12 },
  inputEmoji: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: Colors.text.primary },
  textAreaSmall: { minHeight: 60, textAlignVertical: 'top' },
  textAreaLarge: { minHeight: 200, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: Colors.text.muted, textAlign: 'right', marginTop: 4 },
  premiumToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.bg.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  premiumToggleActive: { borderColor: Colors.brand.warning, backgroundColor: Colors.brand.warning + '10' },
  premiumLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumEmoji: { fontSize: 24 },
  premiumLabel: { fontSize: 14, fontWeight: '700', color: Colors.text.primary },
  premiumHint: { fontSize: 11, color: Colors.text.muted },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.bg.card, padding: 2 },
  toggleActive: { backgroundColor: Colors.brand.warning },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.text.muted },
  toggleDotActive: { backgroundColor: '#fff', marginLeft: 'auto' },
  createBtn: { marginTop: Spacing.sm, borderRadius: Radius.full, overflow: 'hidden' },
  createBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  createBtnEmoji: { fontSize: 20 },
  createBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
