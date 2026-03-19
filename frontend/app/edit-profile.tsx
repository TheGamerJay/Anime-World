import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Colors, Spacing, Radius } from '../src/theme';
import { profileAPI } from '../src/api';
import { useAuth } from '../src/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [localAvatarType, setLocalAvatarType] = useState<string | null>(null);

  const currentAvatarUrl = user?.avatar_url ? `${BACKEND_URL}${user.avatar_url}` : null;
  const currentAvatarType = user?.avatar_type || null;

  const pickMedia = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your media library to upload an avatar.');
      return;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileUri = asset.uri;
      const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
      const fileName = asset.fileName || `avatar.${mimeType.split('/')[1]}`;
      
      // Check file size (rough estimate)
      const fileSizeInMB = (asset.fileSize || 0) / (1024 * 1024);
      if (fileSizeInMB > 20) {
        Alert.alert('File Too Large', 'Please select a file under 20MB.');
        return;
      }

      // Set local preview
      setLocalAvatarUri(fileUri);
      setLocalAvatarType(asset.type === 'video' ? 'video' : (mimeType === 'image/gif' ? 'gif' : 'image'));

      // Upload immediately
      await uploadAvatar(fileUri, mimeType, fileName);
    }
  };

  const uploadAvatar = async (fileUri: string, mimeType: string, fileName: string) => {
    setUploadingAvatar(true);
    try {
      await profileAPI.uploadAvatar(fileUri, mimeType, fileName);
      await refreshUser();
      Alert.alert('Avatar Updated!', 'Your profile picture has been changed.');
      setLocalAvatarUri(null);
      setLocalAvatarType(null);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Failed to upload avatar. Please try again.');
      setLocalAvatarUri(null);
      setLocalAvatarType(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    Alert.alert('Remove Avatar', 'Are you sure you want to remove your profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setUploadingAvatar(true);
          try {
            await profileAPI.deleteAvatar();
            await refreshUser();
            setLocalAvatarUri(null);
            setLocalAvatarType(null);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to remove avatar');
          } finally {
            setUploadingAvatar(false);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await profileAPI.update({ bio: bio.trim(), avatar_color: avatarColor });
      await refreshUser();
      Alert.alert('Success!', 'Your profile has been updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Oops!', err.message || 'Failed to update profile');
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
  const displayAvatarUri = localAvatarUri || currentAvatarUrl;
  const displayAvatarType = localAvatarType || currentAvatarType;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading || uploadingAvatar} style={styles.saveBtn}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.brand.cyan} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickMedia} disabled={uploadingAvatar} style={styles.avatarTouchable}>
              {displayAvatarUri ? (
                <View style={styles.avatarMediaContainer}>
                  {displayAvatarType === 'video' ? (
                    <Video
                      source={{ uri: displayAvatarUri }}
                      style={styles.avatarMedia}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                      isMuted
                    />
                  ) : (
                    <Image
                      source={{ uri: displayAvatarUri }}
                      style={styles.avatarMedia}
                      resizeMode="cover"
                    />
                  )}
                  {uploadingAvatar && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                    </View>
                  )}
                </View>
              ) : (
                <LinearGradient colors={[avatarColor, avatarColor + '60']} style={styles.avatarGradient}>
                  <View style={styles.avatarInner}>
                    <Text style={[styles.avatarLetter, { color: avatarColor }]}>{initial}</Text>
                  </View>
                </LinearGradient>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>

            {/* Avatar Action Buttons */}
            <View style={styles.avatarActions}>
              <TouchableOpacity onPress={pickMedia} disabled={uploadingAvatar} style={styles.avatarActionBtn}>
                <Ionicons name="image-outline" size={18} color={Colors.brand.cyan} />
                <Text style={styles.avatarActionText}>Upload Photo/Video</Text>
              </TouchableOpacity>
              {(displayAvatarUri || currentAvatarUrl) && (
                <TouchableOpacity onPress={removeAvatar} disabled={uploadingAvatar} style={[styles.avatarActionBtn, styles.avatarRemoveBtn]}>
                  <Ionicons name="trash-outline" size={18} color={Colors.brand.error} />
                  <Text style={[styles.avatarActionText, { color: Colors.brand.error }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.avatarHint}>Supports: Images, GIFs, Videos (up to 20MB)</Text>
          </View>

          {/* Avatar Color Picker (fallback when no image) */}
          <View style={styles.section}>
            <Text style={styles.label}>🎨 Fallback Avatar Color</Text>
            <Text style={styles.labelHint}>Used when no profile picture is set</Text>
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
  avatarTouchable: { position: 'relative' },
  avatarGradient: { width: 120, height: 120, borderRadius: 60, padding: 3 },
  avatarInner: {
    flex: 1, borderRadius: 57, backgroundColor: Colors.bg.default,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 44, fontWeight: '800' },
  avatarMediaContainer: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', backgroundColor: Colors.bg.card },
  avatarMedia: { width: '100%', height: '100%' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.brand.cyan,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.bg.default,
  },
  username: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.md },
  email: { fontSize: 14, color: Colors.text.muted, marginTop: 4 },
  avatarActions: { flexDirection: 'row', gap: 12, marginTop: Spacing.md },
  avatarActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, backgroundColor: Colors.brand.cyanDim,
    borderWidth: 1, borderColor: Colors.brand.cyan + '40',
  },
  avatarRemoveBtn: { backgroundColor: 'rgba(255,0,85,0.1)', borderColor: 'rgba(255,0,85,0.3)' },
  avatarActionText: { color: Colors.brand.cyan, fontSize: 13, fontWeight: '600' },
  avatarHint: { color: Colors.text.muted, fontSize: 11, marginTop: Spacing.sm },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  labelHint: { fontSize: 11, color: Colors.text.muted, marginBottom: Spacing.sm },
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
