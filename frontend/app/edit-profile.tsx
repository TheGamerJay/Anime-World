import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { profileAPI } from '../src/api';
import { useAuth } from '../src/AuthContext';

const AVATAR_COLORS = [
  '#00F0FF', '#FF55A5', '#A855F7', '#22C55E', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F97316', '#06B6D4',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#00F0FF');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await profileAPI.update({ bio: bio.trim(), avatar_color: avatarColor });
      await refreshUser();
      Alert.alert('Success! 🎉', 'Your profile has been updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Oops! 🙈', err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Please sign in to edit your profile</Text>
          <TouchableOpacity onPress={() => router.push('/auth')} style={styles.signInBtn}>
            <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signInGradient}>
              <Text style={styles.signInText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.brand.cyan} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Preview */}
          <View style={styles.avatarSection}>
            <LinearGradient colors={[avatarColor, avatarColor + '60']} style={styles.avatarGradient}>
              <View style={styles.avatarInner}>
                <Text style={[styles.avatarLetter, { color: avatarColor }]}>{initial}</Text>
              </View>
            </LinearGradient>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          {/* Avatar Color Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>🎨 Avatar Color</Text>
            <View style={styles.colorGrid}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setAvatarColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    avatarColor === color && styles.colorOptionSelected,
                  ]}
                >
                  {avatarColor === color && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.label}>📝 Bio</Text>
            <TextInput
              style={styles.bioInput}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.text.muted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>

          {/* Account Info */}
          <View style={styles.section}>
            <Text style={styles.label}>👤 Account Info</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{user.username}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Type</Text>
                <Text style={[styles.infoValue, user.is_creator && { color: Colors.brand.success }]}>
                  {user.is_creator ? '✅ Creator' : 'Viewer'}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Membership</Text>
                <Text style={[styles.infoValue, user.is_premium && { color: Colors.brand.warning }]}>
                  {user.is_premium ? '⭐ Premium' : 'Free'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { color: Colors.text.muted, fontSize: 16, textAlign: 'center', marginBottom: 16 },
  signInBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  signInGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  signInText: { color: '#000', fontWeight: '700', fontSize: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  saveText: { color: Colors.brand.cyan, fontSize: 16, fontWeight: '700' },
  content: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, padding: 3 },
  avatarInner: {
    flex: 1, borderRadius: 47, backgroundColor: Colors.bg.default,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '800' },
  username: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.md },
  email: { fontSize: 14, color: Colors.text.muted, marginTop: 4 },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.sm },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  colorOptionSelected: { borderWidth: 3, borderColor: '#fff' },
  bioInput: {
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, color: Colors.text.primary,
    fontSize: 16, minHeight: 120, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: Colors.text.muted, textAlign: 'right', marginTop: 4 },
  infoCard: {
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  infoDivider: { height: 1, backgroundColor: Colors.border },
  infoLabel: { color: Colors.text.muted, fontSize: 14 },
  infoValue: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
});
