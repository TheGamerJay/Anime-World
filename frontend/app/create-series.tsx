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

export default function CreateSeriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
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
      setGenres(res.genres || []);
    } catch {}
    setLoadingGenres(false);
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!genre) {
      Alert.alert('Error', 'Please select a genre');
      return;
    }

    setLoading(true);
    try {
      const tagsList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      await seriesAPI.create({
        title: title.trim(),
        description: description.trim(),
        genre,
        tags: tagsList,
      });
      Alert.alert('Success', 'Your series has been created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create series');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_creator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>You must be a creator to create series</Text>
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Series</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter series title"
                placeholderTextColor={Colors.text.muted}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your series..."
                placeholderTextColor={Colors.text.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
            </View>

            {/* Genre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Genre *</Text>
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
                      <Text style={[styles.genreChipText, genre === g && styles.genreChipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Tags */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="action, adventure, fantasy"
                placeholderTextColor={Colors.text.muted}
                value={tags}
                onChangeText={setTags}
              />
            </View>

            {/* Create Button */}
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading}
              style={styles.createBtn}
            >
              <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGradient}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#000" />
                    <Text style={styles.createBtnText}>Create Series</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.text.muted, fontSize: 16, marginBottom: 16 },
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
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 16, color: Colors.text.primary,
    borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  genreList: { gap: 8 },
  genreChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.border,
  },
  genreChipActive: { backgroundColor: Colors.brand.cyanDim, borderColor: Colors.brand.cyan },
  genreChipText: { color: Colors.text.secondary, fontSize: 14, fontWeight: '600' },
  genreChipTextActive: { color: Colors.brand.cyan },
  createBtn: { marginTop: Spacing.md, borderRadius: Radius.full, overflow: 'hidden' },
  createBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  createBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
