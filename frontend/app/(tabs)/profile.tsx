import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={48} color={Colors.text.muted} />
          </View>
          <Text style={styles.emptyTitle}>Join Anime World</Text>
          <Text style={styles.emptySubtext}>Sign in to track your progress, save favorites, and more</Text>
          <TouchableOpacity testID="profile-login-btn" onPress={() => router.push('/auth')} style={styles.signInBtn}>
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Avatar + Info */}
        <View style={styles.profileSection}>
          <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} style={styles.avatarGradient}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          </LinearGradient>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem icon="time-outline" label="Watch History" onPress={() => {}} />
          <MenuItem icon="settings-outline" label="Settings" onPress={() => {}} />
          <MenuItem icon="information-circle-outline" label="About" onPress={() => {}} />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
        </View>

        {/* Sign Out */}
        <TouchableOpacity testID="logout-btn" onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={Colors.brand.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon as any} size={22} color={Colors.text.secondary} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40, marginTop: 80 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.bg.card,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: 8 },
  emptySubtext: { fontSize: 14, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
  signInBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  signInGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  signInText: { color: '#000', fontWeight: '700', fontSize: 16 },
  profileSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  avatarGradient: { width: 88, height: 88, borderRadius: 44, padding: 3 },
  avatarInner: {
    flex: 1, borderRadius: 42, backgroundColor: Colors.bg.default,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 32, fontWeight: '800', color: Colors.brand.cyan },
  username: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.md },
  email: { fontSize: 14, color: Colors.text.muted, marginTop: 4 },
  menuSection: { marginTop: Spacing.lg, marginHorizontal: Spacing.md, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 16, color: Colors.text.primary, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: Spacing.xl, marginHorizontal: Spacing.md, paddingVertical: 14,
    borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(255,0,85,0.3)',
    backgroundColor: 'rgba(255,0,85,0.08)',
  },
  logoutText: { fontSize: 16, color: Colors.brand.error, fontWeight: '600' },
});
