import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';
import { myContentAPI, seriesAPI } from '../../src/api';
import { Series } from '../../src/types';

function formatMoney(amount: number): string {
  return '$' + amount.toFixed(2);
}

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function StudioScreen() {
  const router = useRouter();
  const { user, becomeCreator, refreshUser } = useAuth();
  const [mySeries, setMySeries] = useState<Series[]>([]);
  const [earnings, setEarnings] = useState({ total_earnings: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [becomingCreator, setBecomingCreator] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.is_creator) {
      setLoading(false);
      return;
    }
    try {
      const [seriesRes, earningsRes] = await Promise.all([
        myContentAPI.getMySeries(),
        myContentAPI.getMyEarnings(),
      ]);
      setMySeries(seriesRes.data || []);
      setEarnings(earningsRes);
    } catch (err) {
      console.error('Failed to load studio data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.is_creator]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBecomeCreator = async () => {
    setBecomingCreator(true);
    try {
      await becomeCreator();
      Alert.alert('Welcome, Creator!', 'You can now upload your original anime series.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to become creator');
    } finally {
      setBecomingCreator(false);
    }
  };

  const handleDeleteSeries = (seriesId: string, title: string) => {
    Alert.alert(
      'Delete Series',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await seriesAPI.delete(seriesId);
              setMySeries(mySeries.filter(s => s.id !== seriesId));
            } catch {}
          },
        },
      ]
    );
  };

  // Not logged in
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Creator Studio</Text>
        </View>
        <View style={styles.emptyContainer}>
          <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} style={styles.iconCircle}>
            <Ionicons name="videocam" size={40} color="#000" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Share Your Anime</Text>
          <Text style={styles.emptySubtext}>Sign in to upload your original anime series and earn from your passion</Text>
          <TouchableOpacity onPress={() => router.push('/auth')} style={styles.signInBtn}>
            <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signInGradient}>
              <Text style={styles.signInText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Logged in but not a creator
  if (!user.is_creator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Become a Creator</Text>
        </View>
        <ScrollView contentContainerStyle={styles.becomeCreatorContent}>
          <LinearGradient colors={[Colors.brand.cyan + '30', Colors.brand.pink + '30']} style={styles.promoCard}>
            <Ionicons name="sparkles" size={48} color={Colors.brand.cyan} />
            <Text style={styles.promoTitle}>Share Your Vision</Text>
            <Text style={styles.promoText}>Join our community of independent anime creators. Upload your original series and build your audience.</Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.brand.success} />
                <Text style={styles.benefitText}>Upload unlimited episodes</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.brand.success} />
                <Text style={styles.benefitText}>Earn from tips & subscriptions</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.brand.success} />
                <Text style={styles.benefitText}>Build your fanbase</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.brand.success} />
                <Text style={styles.benefitText}>Analytics & insights</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleBecomeCreator}
              disabled={becomingCreator}
              style={styles.becomeCreatorBtn}
            >
              <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.becomeCreatorGradient}>
                {becomingCreator ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="rocket" size={20} color="#000" />
                    <Text style={styles.becomeCreatorText}>Start Creating</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Creator dashboard
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Creator Studio</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.cyan} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Creator Studio</Text>
          <TouchableOpacity onPress={() => router.push('/create-series')} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={Colors.brand.cyan} />
          </TouchableOpacity>
        </View>

        {/* Earnings Card */}
        <TouchableOpacity onPress={() => router.push('/creator-dashboard')} activeOpacity={0.8}>
          <View style={styles.earningsCard}>
            <LinearGradient colors={[Colors.brand.cyan + '20', Colors.brand.pink + '20']} style={StyleSheet.absoluteFill} />
            <View style={styles.earningsRow}>
              <View style={styles.earningItem}>
                <Text style={styles.earningLabel}>Total Earnings</Text>
                <Text style={styles.earningValue}>{formatMoney(earnings.total_earnings)}</Text>
              </View>
              <View style={styles.earningDivider} />
              <View style={styles.earningItem}>
                <Text style={styles.earningLabel}>Available Balance</Text>
                <Text style={[styles.earningValue, { color: Colors.brand.success }]}>{formatMoney(earnings.balance)}</Text>
              </View>
            </View>
            <View style={styles.viewAnalyticsRow}>
              <Ionicons name="analytics" size={16} color={Colors.brand.cyan} />
              <Text style={styles.viewAnalyticsText}>View Full Analytics</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.brand.cyan} />
            </View>
          </View>
        </TouchableOpacity>

        {/* My Series */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Series</Text>
          <Text style={styles.countText}>{mySeries.length} series</Text>
        </View>

        {mySeries.length === 0 ? (
          <View style={styles.noSeriesContainer}>
            <Ionicons name="film-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.noSeriesText}>You haven't created any series yet</Text>
            <TouchableOpacity onPress={() => router.push('/create-series')} style={styles.createFirstBtn}>
              <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createFirstGradient}>
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.createFirstText}>Create Your First Series</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          mySeries.map((series) => (
            <TouchableOpacity
              key={series.id}
              onPress={() => router.push(`/series/${series.id}`)}
              style={styles.seriesItem}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[series.creator_avatar_color + '30', Colors.bg.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.seriesItemContent}>
                <View style={styles.seriesItemLeft}>
                  <Text style={styles.seriesItemTitle} numberOfLines={1}>{series.title}</Text>
                  <View style={styles.seriesItemMeta}>
                    <Text style={styles.seriesItemGenre}>{series.genre}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.seriesItemEps}>{series.episode_count} episodes</Text>
                  </View>
                  <View style={styles.seriesItemStats}>
                    <Ionicons name="eye-outline" size={12} color={Colors.text.muted} />
                    <Text style={styles.statText}>{formatCount(series.view_count)}</Text>
                    <Ionicons name="heart" size={12} color={Colors.brand.pink} style={{ marginLeft: 8 }} />
                    <Text style={styles.statText}>{formatCount(series.like_count)}</Text>
                  </View>
                </View>
                <View style={styles.seriesItemActions}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteSeries(series.id, series.title);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.brand.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  addBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.cyanDim,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: 8 },
  emptySubtext: { fontSize: 14, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
  signInBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  signInGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  signInText: { color: '#000', fontWeight: '700', fontSize: 16 },
  becomeCreatorContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  promoCard: {
    borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  promoTitle: { fontSize: 24, fontWeight: '800', color: Colors.text.primary, marginTop: Spacing.md },
  promoText: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  benefitsList: { marginTop: Spacing.lg, width: '100%', gap: 12 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { color: Colors.text.primary, fontSize: 14 },
  becomeCreatorBtn: { marginTop: Spacing.xl, borderRadius: Radius.full, overflow: 'hidden' },
  becomeCreatorGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  becomeCreatorText: { color: '#000', fontWeight: '700', fontSize: 16 },
  earningsCard: {
    marginHorizontal: Spacing.md, borderRadius: Radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  earningsRow: { flexDirection: 'row', padding: Spacing.md },
  earningItem: { flex: 1, alignItems: 'center' },
  earningLabel: { color: Colors.text.muted, fontSize: 12, marginBottom: 4 },
  earningValue: { color: Colors.text.primary, fontSize: 24, fontWeight: '800' },
  earningDivider: { width: 1, backgroundColor: Colors.border },
  viewAnalyticsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  viewAnalyticsText: { color: Colors.brand.cyan, fontSize: 13, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  countText: { color: Colors.text.muted, fontSize: 13 },
  noSeriesContainer: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40, gap: 12 },
  noSeriesText: { color: Colors.text.muted, fontSize: 14, textAlign: 'center' },
  createFirstBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  createFirstGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12 },
  createFirstText: { color: '#000', fontWeight: '700', fontSize: 14 },
  seriesItem: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm, borderRadius: Radius.md,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  seriesItemContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md,
  },
  seriesItemLeft: { flex: 1, marginRight: Spacing.sm },
  seriesItemTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  seriesItemMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  seriesItemGenre: { color: Colors.brand.pink, fontSize: 12, fontWeight: '600' },
  metaDot: { color: Colors.text.muted, marginHorizontal: 6 },
  seriesItemEps: { color: Colors.text.muted, fontSize: 12 },
  seriesItemStats: { flexDirection: 'row', alignItems: 'center' },
  statText: { color: Colors.text.muted, fontSize: 11, marginLeft: 3 },
  seriesItemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 8 },
});
