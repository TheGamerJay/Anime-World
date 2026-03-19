import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth } from '../src/AuthContext';
import { profilesAPI } from '../src/api';

const AVATAR_COLORS = ['#00F0FF', '#FF0099', '#7000FF', '#00FF94', '#FFD600', '#FF5500', '#0088FF', '#FF3366'];

export default function SwitchProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[1]);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    if (user) loadProfiles();
    else { setLoading(false); }
  }, [user]);

  async function loadProfiles() {
    try {
      const res = await profilesAPI.getAll();
      setProfiles(res.profiles || []);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSwitch(profileId: string) {
    if (isManaging) return;
    try {
      await profilesAPI.switchTo(profileId);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to switch profile');
    }
  }

  async function handleAddProfile() {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a profile name');
      return;
    }
    try {
      await profilesAPI.create(newName.trim(), selectedColor);
      setShowAddModal(false);
      setNewName('');
      loadProfiles();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create profile');
    }
  }

  async function handleDeleteProfile(profileId: string, profileName: string) {
    Alert.alert('Delete Profile', `Delete "${profileName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await profilesAPI.remove(profileId);
            loadProfiles();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete profile');
          }
        }
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.cyan} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="switch-profile-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Switch Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.profilesGrid}>
        {profiles.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            testID={`profile-${profile.id}`}
            onPress={() => isManaging ? handleDeleteProfile(profile.id, profile.name) : handleSwitch(profile.id)}
            style={styles.profileItem}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarCircle, { borderColor: profile.is_active ? profile.avatar_color : Colors.border }]}>
              {isManaging && !profile.is_active && (
                <View style={styles.deleteOverlay}>
                  <Ionicons name="close" size={28} color={Colors.brand.error} />
                </View>
              )}
              <LinearGradient
                colors={[profile.avatar_color, profile.avatar_color + '80']}
                style={styles.avatarInner}
              >
                <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            </View>
            <Text style={[styles.profileName, profile.is_active && { color: profile.avatar_color }]}>{profile.name}</Text>
            {profile.is_active && <Text style={[styles.activeTag, { color: profile.avatar_color }]}>Active</Text>}
          </TouchableOpacity>
        ))}

        {profiles.length < 5 && (
          <TouchableOpacity testID="add-profile-btn" onPress={() => setShowAddModal(true)} style={styles.profileItem}>
            <View style={styles.addCircle}>
              <Ionicons name="add" size={36} color={Colors.text.secondary} />
            </View>
            <Text style={styles.profileName}>Add Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        testID="manage-profiles-btn"
        onPress={() => setIsManaging(!isManaging)}
        style={styles.manageBtn}
      >
        <Text style={[styles.manageBtnText, isManaging && { color: Colors.brand.pink }]}>
          {isManaging ? 'Done' : 'Manage Profiles'}
        </Text>
      </TouchableOpacity>

      {/* Add Profile Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Profile</Text>
            <TextInput
              testID="new-profile-name-input"
              style={styles.modalInput}
              placeholder="Profile name"
              placeholderTextColor={Colors.text.muted}
              value={newName}
              onChangeText={setNewName}
              maxLength={20}
            />
            <Text style={styles.colorLabel}>Choose Color</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorDotSelected]}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setNewName(''); }} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="confirm-add-profile" onPress={handleAddProfile} style={styles.confirmBtn}>
                <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmGradient}>
                  <Text style={styles.confirmBtnText}>Create</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  profilesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingTop: 60, paddingHorizontal: Spacing.lg, gap: 32 },
  profileItem: { alignItems: 'center', width: 120, gap: 10 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, overflow: 'hidden', position: 'relative' },
  avatarInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 40, fontWeight: '800', color: '#000' },
  deleteOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  addCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  profileName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, textAlign: 'center' },
  activeTag: { fontSize: 12, fontWeight: '700' },
  manageBtn: { position: 'absolute', bottom: 100, alignSelf: 'center' },
  manageBtnText: { fontSize: 16, fontWeight: '600', color: Colors.text.secondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.bg.surface, borderRadius: Radius.lg, padding: Spacing.lg, width: '85%', borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.lg, textAlign: 'center' },
  modalInput: { backgroundColor: Colors.bg.card, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 48, color: Colors.text.primary, fontSize: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  colorLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.muted, letterSpacing: 1, marginBottom: Spacing.sm },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: Spacing.lg },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.text.primary },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { color: Colors.text.secondary, fontWeight: '600', fontSize: 15 },
  confirmBtn: { flex: 1, borderRadius: Radius.full, overflow: 'hidden' },
  confirmGradient: { paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
