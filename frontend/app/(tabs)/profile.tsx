import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Colors, Spacing, Radius } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function formatMoney(amount: number): string {
  return '$' + amount.toFixed(2);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.brand.cyan} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>
        <ScrollView contentContainerStyle={styles.signedOutContent}>
          <View style={styles.emptyContainer}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={Colors.text.muted} />
            </View>
            <Text style={styles.emptyTitle}>Join Anime World</Text>
            <Text style={styles.emptySubtext}>Sign in to track your progress, save favorites, and become a creator</Text>
            <TouchableOpacity testID="profile-login-btn" onPress={() => router.push('/auth')} style={styles.signInBtn}>
              <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signInGradient}>
                <Text style={styles.signInText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>Legal & Policies</Text>
            <View style={styles.menuSection}>
              <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => router.push('/policies/privacy')} />
              <MenuItem icon="reader-outline" label="Terms of Service" onPress={() => router.push('/policies/terms')} />
              <MenuItem icon="alert-circle-outline" label="Disclaimer" onPress={() => router.push('/policies/disclaimer')} />
              <MenuItem icon="shield-checkmark-outline" label="DMCA / Copyright" onPress={() => router.push('/policies/dmca')} />
              <MenuItem icon="finger-print-outline" label="Cookie Policy" onPress={() => router.push('/policies/cookies')} />
              <MenuItem icon="information-circle-outline" label="About Us" onPress={() => router.push('/policies/about')} />
              <MenuItem icon="mail-outline" label="Contact Us" onPress={() => router.push('/policies/contact')} isLast />
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const profileColor = user.avatar_color || Colors.brand.cyan;
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity 
            onPress={() => router.push('/notifications')} 
            style={styles.notifBtn}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Avatar + Info */}
        <View style={styles.profileSection}>
          {user.avatar_url ? (
            <View style={styles.avatarMediaContainer}>
              {user.avatar_type === 'video' ? (
                <Video
                  source={{ uri: `${BACKEND_URL}${user.avatar_url}` }}
                  style={styles.avatarMedia}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                />
              ) : (
                <Image
                  source={{ uri: `${BACKEND_URL}${user.avatar_url}` }}
                  style={styles.avatarMedia}
                  resizeMode="cover"
                />
              )}
            </View>
          ) : (
            <LinearGradient colors={[profileColor, profileColor + '60']} style={styles.avatarGradient}>
              <View style={styles.avatarInner}>
                <Text style={[styles.avatarLetter, { color: profileColor }]}>{initial}</Text>
              </View>
            </LinearGradient>
          )}
          <View style={styles.nameRow}>
            <Text style={styles.username}>{user.username}</Text>
            {user.is_creator && (
              <View style={styles.creatorBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.brand.success} />
                <Text style={styles.creatorBadgeText}>Creator</Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{user.email}</Text>
          
          {/* Edit Profile Button */}
          <TouchableOpacity 
            onPress={() => router.push('/edit-profile')} 
            style={styles.editProfileBtn}
          >
            <Ionicons name="create-outline" size={18} color={Colors.brand.cyan} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.follower_count}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.following_count}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            {user.is_creator && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.brand.success }]}>{formatMoney(user.balance)}</Text>
                  <Text style={styles.statLabel}>Balance</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Premium Card */}
        {!user.is_premium && (
          <TouchableOpacity onPress={() => {}} style={styles.premiumCard}>
            <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <Ionicons name="star" size={24} color="#000" />
            <View style={styles.premiumTextContainer}>
              <Text style={styles.premiumTitle}>Go Premium</Text>
              <Text style={styles.premiumSubtext}>Ad-free viewing & exclusive content</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
        )}

        {/* Analytics Menu */}
        <View style={styles.menuSection}>
          <MenuItem icon="notifications" label="Notifications" onPress={() => router.push('/notifications')} />
          <MenuItem icon="heart" label="My Support History" onPress={() => router.push('/fan-dashboard')} />
          {user.is_creator && (
            <MenuItem icon="analytics" label="Creator Analytics" onPress={() => router.push('/creator-dashboard')} />
          )}
          <MenuItem icon="time-outline" label="Watch History" onPress={() => router.push('/history')} />
          <MenuItem icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} isLast />
        </View>

        {/* Legal & Policies */}
        <View style={styles.legalSection}>
          <Text style={styles.legalSectionTitle}>Legal & Policies</Text>
          <View style={styles.menuSection}>
            <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => router.push('/policies/privacy')} />
            <MenuItem icon="reader-outline" label="Terms of Service" onPress={() => router.push('/policies/terms')} />
            <MenuItem icon="alert-circle-outline" label="Disclaimer" onPress={() => router.push('/policies/disclaimer')} />
            <MenuItem icon="shield-checkmark-outline" label="DMCA / Copyright" onPress={() => router.push('/policies/dmca')} />
            <MenuItem icon="finger-print-outline" label="Cookie Policy" onPress={() => router.push('/policies/cookies')} />
            <MenuItem icon="information-circle-outline" label="About Us" onPress={() => router.push('/policies/about')} />
            <MenuItem icon="mail-outline" label="Contact Us" onPress={() => router.push('/policies/contact')} isLast />
          </View>
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

function MenuItem({ icon, label, onPress, isLast = false }: { icon: string; label: string; onPress: () => void; isLast?: boolean }) {
  return (
    <TouchableOpacity testID={`menu-${label.toLowerCase().replace(/\s+/g, '-')}`} onPress={onPress} style={[styles.menuItem, isLast && styles.menuItemLast]} activeOpacity={0.7}>
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
  signedOutContent: { paddingBottom: 40 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: Spacing.md, 
    paddingTop: Spacing.sm, 
    paddingBottom: Spacing.md 
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  notifBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.bg.surface,
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyContainer: { alignItems: 'center', gap: 12, paddingHorizontal: 40, marginTop: 40 },
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
  avatarLetter: { fontSize: 32, fontWeight: '800' },
  avatarMediaContainer: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    overflow: 'hidden', 
    backgroundColor: Colors.bg.card,
    borderWidth: 2,
    borderColor: Colors.brand.cyan + '40',
  },
  avatarMedia: { width: '100%', height: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.md },
  username: { fontSize: 22, fontWeight: '700', color: Colors.text.primary },
  creatorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.brand.success + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  creatorBadgeText: { color: Colors.brand.success, fontSize: 11, fontWeight: '700' },
  email: { fontSize: 14, color: Colors.text.muted, marginTop: 4 },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.cyanDim,
    borderWidth: 1,
    borderColor: Colors.brand.cyan + '40',
  },
  editProfileText: { color: Colors.brand.cyan, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md },
  statItem: { alignItems: 'center', paddingHorizontal: 16 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  statLabel: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  premiumCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginTop: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.md, overflow: 'hidden', gap: 12,
  },
  premiumTextContainer: { flex: 1 },
  premiumTitle: { color: '#000', fontSize: 16, fontWeight: '700' },
  premiumSubtext: { color: '#000', fontSize: 12, opacity: 0.8 },
  legalSection: { marginTop: Spacing.lg },
  legalSectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  menuSection: { marginHorizontal: Spacing.md, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
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
