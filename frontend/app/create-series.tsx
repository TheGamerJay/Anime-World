import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { seriesAPI, feedAPI } from '../src/api';
import { useAuth } from '../src/AuthContext';

const CONTENT_TYPES = [
  { id: 'series', label: '📺 Series', emoji: '📺', description: 'Multi-episode content' },
  { id: 'novel', label: '📖 Novel', emoji: '📖', description: 'Written stories & chapters' },
  { id: 'movie', label: '🎬 Movie', emoji: '🎬', description: 'Single feature film' },
];

export default function CreateSeriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('series');
  const [genre, setGenre] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [tags, setTags] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(true);

  useEffect(() => {
    loadGenres();
  }, []);

  async function loadGenres() {
    try {
      const res = await feedAPI.getGenres();
      setGenres([...(res.genres || []), 'Custom']);
    } catch {}
    setLoadingGenres(false);
  }

  const getContentTypeLabel = () => {
    const type = CONTENT_TYPES.find(t => t.id === contentType);
    return type ? type.label : 'Content';
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter a description');
      return;
    }
    if (!genre) {
      Alert.alert('Oops! 🙈', 'Please select a genre');
      return;
    }
    if (genre === 'Custom' && !customGenre.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter your custom genre');
      return;
    }

    setLoading(true);
    try {
      const tagsList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      await seriesAPI.create({
        title: title.trim(),
        description: description.trim(),
        genre: genre,
        custom_genre: genre === 'Custom' ? customGenre.trim() : null,
        content_type: contentType,
        tags: tagsList,
      });
      Alert.alert('Success! 🎉', `Your ${contentType} has been created!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Oops! 🙈', err.message || 'Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_creator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorEmoji}>🙈</Text>
          <Text style={styles.errorText}>You must be a creator to create content</Text>
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
            <Text style={styles.headerTitle}>Create New Content ✨</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Content Type *</Text>
              <Text style={styles.labelHint}>What are you creating?</Text>
              <View style={styles.contentTypeRow}>
                {CONTENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setContentType(type.id)}
                    style={[styles.contentTypeCard, contentType === type.id && styles.contentTypeCardActive]}
                  >
                    <Text style={styles.contentTypeEmoji}>{type.emoji}</Text>
                    <Text style={[styles.contentTypeLabel, contentType === type.id && styles.contentTypeLabelActive]}>
                      {type.id.charAt(0).toUpperCase() + type.id.slice(1)}
                    </Text>
                    <Text style={styles.contentTypeDesc}>{type.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputEmoji}>✏️</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${contentType} title`}
                  placeholderTextColor={Colors.text.muted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={`Describe your ${contentType}... What's it about? 🤔`}
                  placeholderTextColor={Colors.text.muted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                />
              </View>
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Genre *</Text>
              <Text style={styles.labelHint}>Select a genre or create your own!</Text>
              {loadingGenres ? (
                <ActivityIndicator size="small" color={Colors.brand.cyan} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreList}>
                  {genres.map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGenre(g)}
                      style={[styles.genreChip, genre === g && styles.genreChipActive]}
                    >
                      {g === 'Custom' && <Text style={styles.genreChipEmoji}>✨</Text>}
                      <Text style={[styles.genreChipText, genre === g && styles.genreChipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {genre === 'Custom' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Custom Genre ✨</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputEmoji}>🎨</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your unique genre"
                    placeholderTextColor={Colors.text.muted}
                    value={customGenre}
                    onChangeText={setCustomGenre}
                    maxLength={30}
                  />
                </View>
                <Text style={styles.customGenreHint}>💡 Examples: Isekai, Mecha, Slice of Life, Horror Comedy</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags</Text>
              <Text style={styles.labelHint}>Comma separated (helps people find your content)</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputEmoji}>🏷️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="action, adventure, fantasy"
                  placeholderTextColor={Colors.text.muted}
                  value={tags}
                  onChangeText={setTags}
                />
              </View>
            </View>

            <TouchableOpacity onPress={handleCreate} disabled={loading} style={styles.createBtn}>
              <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGradient}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text style={styles.createBtnEmoji}>{contentType === 'series' ? '📺' : contentType === 'novel' ? '📖' : '🎬'}</Text>
                    <Text style={styles.createBtnText}>Create {getContentTypeLabel()}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 Tips for Success</Text>
              <Text style={styles.tipText}>• Write a catchy title that stands out</Text>
              <Text style={styles.tipText}>• Use a detailed description to hook readers</Text>
              <Text style={styles.tipText}>• Choose the right genre to reach your audience</Text>
              <Text style={styles.tipText}>• Add relevant tags for better discoverability</Text>
            </View>
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
  form: { padding: Spacing.md },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  labelHint: { fontSize: 12, color: Colors.text.muted, marginBottom: 8 },
  contentTypeRow: { flexDirection: 'row', gap: 10 },
  contentTypeCard: {
    flex: 1, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  contentTypeCardActive: { borderColor: Colors.brand.cyan, backgroundColor: Colors.brand.cyanDim },
  contentTypeEmoji: { fontSize: 28, marginBottom: 4 },
  contentTypeLabel: { fontSize: 13, fontWeight: '700', color: Colors.text.secondary },
  contentTypeLabelActive: { color: Colors.brand.cyan },
  contentTypeDesc: { fontSize: 10, color: Colors.text.muted, textAlign: 'center', marginTop: 2 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.border,
  },
  textAreaContainer: { alignItems: 'flex-start', paddingVertical: 12 },
  inputEmoji: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: Colors.text.primary },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: Colors.text.muted, textAlign: 'right', marginTop: 4 },
  genreList: { gap: 8, paddingVertical: 4 },
  genreChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.full, backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.border,
  },
  genreChipActive: { backgroundColor: Colors.brand.cyanDim, borderColor: Colors.brand.cyan },
  genreChipEmoji: { fontSize: 14, marginRight: 4 },
  genreChipText: { color: Colors.text.secondary, fontSize: 14, fontWeight: '600' },
  genreChipTextActive: { color: Colors.brand.cyan },
  customGenreHint: { fontSize: 12, color: Colors.text.muted, marginTop: 8, fontStyle: 'italic' },
  createBtn: { marginTop: Spacing.md, borderRadius: Radius.full, overflow: 'hidden' },
  createBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  createBtnEmoji: { fontSize: 20 },
  createBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  tipsSection: {
    marginTop: Spacing.xl, backgroundColor: Colors.bg.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 8 },
  tipText: { fontSize: 12, color: Colors.text.muted, marginBottom: 4, lineHeight: 18 },
});
