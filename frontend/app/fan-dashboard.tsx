import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { analyticsAPI } from '../src/api';
import { useAuth } from '../src/AuthContext';

interface FanAnalytics {
  summary: {
    total_spent: number;
    tips_total: number;
    premium_total: number;
    channel_subs_total: number;
    creators_supported: number;
    total_transactions: number;
    following_count: number;
    is_premium: boolean;
  };
  supported_creators: any[];
  recent_transactions: any[];
  monthly_spending: any[];
}

function formatMoney(amount: number): string {
  return '$' + amount.toFixed(2);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function FanDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<FanAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'creators' | 'transactions'>('creators');

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await analyticsAPI.getFanAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadAnalytics();
    else setLoading(false);
  }, [user, loadAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Support History</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>Support Dashboard</Text>
          <Text style={styles.emptySubtext}>Sign in to see your support history</Text>
          <TouchableOpacity onPress={() => router.push('/auth')} style={styles.signInBtn}>
            <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signInGradient}>
              <Text style={styles.signInText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.cyan} />
        </View>
      </SafeAreaView>
    );
  }

  const s = analytics?.summary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Support History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.cyan} />}
      >
        {/* Total Spent Hero */}
        <View style={styles.spentCard}>
          <LinearGradient
            colors={[Colors.brand.pink + '30', Colors.brand.accent + '30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="heart" size={32} color={Colors.brand.pink} />
          <Text style={styles.spentLabel}>Total Contribution</Text>
          <Text style={styles.spentAmount}>{formatMoney(s?.total_spent || 0)}</Text>
          {s?.is_premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color={Colors.brand.warning} />
              <Text style={styles.premiumText}>Premium Member</Text>
            </View>
          )}
        </View>

        {/* Spending Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Spending Breakdown</Text>
          <View style={styles.breakdownRow}>
            <View style={[styles.breakdownCard, { borderLeftColor: Colors.brand.warning }]}>
              <Ionicons name="gift" size={24} color={Colors.brand.warning} />
              <Text style={styles.breakdownAmount}>{formatMoney(s?.tips_total || 0)}</Text>
              <Text style={styles.breakdownLabel}>Tips Given</Text>
            </View>
            <View style={[styles.breakdownCard, { borderLeftColor: Colors.brand.cyan }]}>
              <Ionicons name="people" size={24} color={Colors.brand.cyan} />
              <Text style={styles.breakdownAmount}>{formatMoney(s?.channel_subs_total || 0)}</Text>
              <Text style={styles.breakdownLabel}>Subscriptions</Text>
            </View>
          </View>
          {(s?.premium_total || 0) > 0 && (
            <View style={[styles.breakdownCardFull, { borderLeftColor: Colors.brand.accent }]}>
              <Ionicons name="star" size={24} color={Colors.brand.accent} />
              <View style={styles.breakdownCardFullText}>
                <Text style={styles.breakdownAmount}>{formatMoney(s?.premium_total || 0)}</Text>
                <Text style={styles.breakdownLabel}>Premium Membership</Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Creators Supported" value={String(s?.creators_supported || 0)} color={Colors.brand.pink} icon="heart" />
          <StatCard label="Transactions" value={String(s?.total_transactions || 0)} color={Colors.brand.cyan} icon="receipt" />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('creators')}
            style={[styles.tab, activeTab === 'creators' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'creators' && styles.tabTextActive]}>Creators Supported</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('transactions')}
            style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>Transaction History</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'creators' && (
          <View style={styles.tabContent}>
            {(analytics?.supported_creators || []).length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="people-outline" size={40} color={Colors.text.muted} />
                <Text style={styles.emptyTabText}>You haven't supported any creators yet</Text>
                <TouchableOpacity onPress={() => router.push('/browse')} style={styles.browseBtn}>
                  <Text style={styles.browseBtnText}>Discover Creators</Text>
                </TouchableOpacity>
              </View>
            ) : (
              (analytics?.supported_creators || []).map((creator) => (
                <TouchableOpacity
                  key={creator.creator_id}
                  onPress={() => router.push(`/creator/${creator.creator_id}`)}
                  style={styles.creatorItem}
                >
                  <LinearGradient
                    colors={[creator.avatar_color, creator.avatar_color + '60']}
                    style={styles.creatorAvatar}
                  >
                    <View style={styles.creatorAvatarInner}>
                      <Text style={[styles.creatorInitial, { color: creator.avatar_color }]}>
                        {creator.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </LinearGradient>
                  <View style={styles.creatorInfo}>
                    <Text style={styles.creatorName}>{creator.username}</Text>
                    <Text style={styles.creatorBio} numberOfLines={1}>{creator.bio || 'Anime creator'}</Text>
                    <Text style={styles.creatorSupports}>
                      {creator.support_count} contribution{creator.support_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.creatorAmounts}>
                    <Text style={styles.creatorTotal}>{formatMoney(creator.total_given)}</Text>
                    <Text style={styles.creatorBreakdown}>Tips: {formatMoney(creator.tips_given)}</Text>
                    <Text style={styles.creatorBreakdown}>Subs: {formatMoney(creator.subs_given)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'transactions' && (
          <View style={styles.tabContent}>
            {(analytics?.recent_transactions || []).length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="receipt-outline" size={40} color={Colors.text.muted} />
                <Text style={styles.emptyTabText}>No transactions yet</Text>
              </View>
            ) : (
              (analytics?.recent_transactions || []).map((tx, index) => (
                <View key={`${tx.session_id}-${index}`} style={styles.transactionItem}>
                  <View style={[styles.txTypeIcon, { 
                    backgroundColor: tx.type === 'tip' ? Colors.brand.warning + '20' : 
                                     tx.type === 'premium' ? Colors.brand.accent + '20' : Colors.brand.cyan + '20' 
                  }]}>
                    <Ionicons
                      name={tx.type === 'tip' ? 'gift' : tx.type === 'premium' ? 'star' : 'people'}
                      size={18}
                      color={tx.type === 'tip' ? Colors.brand.warning : tx.type === 'premium' ? Colors.brand.accent : Colors.brand.cyan}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTo}>
                      {tx.type === 'premium' ? 'Premium Membership' : tx.creator_username}
                    </Text>
                    <Text style={styles.txType}>
                      {tx.type === 'tip' ? 'Tip' : tx.type === 'premium' ? 'Subscription' : 'Channel Sub'}
                    </Text>
                    <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                  </View>
                  <Text style={styles.txAmount}>{formatMoney(tx.amount)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Monthly Spending */}
        <View style={styles.monthlySection}>
          <Text style={styles.sectionTitle}>Monthly Spending</Text>
          {(analytics?.monthly_spending || []).map((month) => (
            <View key={month.month} style={styles.monthItem}>
              <Text style={styles.monthName}>{month.month}</Text>
              <View style={styles.monthStats}>
                <Text style={styles.monthTotal}>{formatMoney(month.total_spent)}</Text>
                <Text style={styles.monthTx}>{month.transaction_count} tx</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  emptySubtext: { fontSize: 14, color: Colors.text.muted, textAlign: 'center' },
  signInBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  signInGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  signInText: { color: '#000', fontWeight: '700', fontSize: 16 },
  // Spent Card
  spentCard: {
    margin: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  spentLabel: { color: Colors.text.muted, fontSize: 14, marginTop: 8 },
  spentAmount: { fontSize: 42, fontWeight: '800', color: Colors.text.primary },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm,
    backgroundColor: Colors.brand.warning + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
  },
  premiumText: { color: Colors.brand.warning, fontSize: 12, fontWeight: '700' },
  // Breakdown Section
  breakdownSection: { paddingHorizontal: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.sm },
  breakdownRow: { flexDirection: 'row', gap: 12 },
  breakdownCard: {
    flex: 1, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: Colors.border,
  },
  breakdownCardFull: {
    marginTop: 12, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: Colors.border,
  },
  breakdownCardFullText: { marginLeft: 12 },
  breakdownAmount: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, marginTop: 8 },
  breakdownLabel: { color: Colors.text.muted, fontSize: 12, marginTop: 4 },
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  statLabel: { color: Colors.text.muted, fontSize: 12, marginTop: 2 },
  // Tabs
  tabsContainer: { flexDirection: 'row', marginHorizontal: Spacing.md, marginTop: Spacing.md, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md, backgroundColor: Colors.bg.surface },
  tabActive: { backgroundColor: Colors.brand.pinkDim },
  tabText: { color: Colors.text.muted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: Colors.brand.pink },
  tabContent: { marginHorizontal: Spacing.md, marginTop: Spacing.md },
  emptyTab: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTabText: { color: Colors.text.muted, fontSize: 14, textAlign: 'center' },
  browseBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.brand.cyan,
  },
  browseBtnText: { color: Colors.brand.cyan, fontWeight: '600', fontSize: 14 },
  // Creator Item
  creatorItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  creatorAvatar: { width: 50, height: 50, borderRadius: 25, padding: 2, marginRight: 12 },
  creatorAvatarInner: { flex: 1, borderRadius: 23, backgroundColor: Colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  creatorInitial: { fontSize: 18, fontWeight: '800' },
  creatorInfo: { flex: 1 },
  creatorName: { color: Colors.text.primary, fontSize: 15, fontWeight: '700' },
  creatorBio: { color: Colors.text.muted, fontSize: 11, marginTop: 2 },
  creatorSupports: { color: Colors.text.secondary, fontSize: 11, marginTop: 2 },
  creatorAmounts: { alignItems: 'flex-end' },
  creatorTotal: { color: Colors.brand.pink, fontSize: 18, fontWeight: '800' },
  creatorBreakdown: { color: Colors.text.muted, fontSize: 10 },
  // Transaction Item
  transactionItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  txTypeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  txInfo: { flex: 1 },
  txTo: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
  txType: { color: Colors.text.muted, fontSize: 11 },
  txDate: { color: Colors.text.muted, fontSize: 10 },
  txAmount: { color: Colors.text.primary, fontSize: 16, fontWeight: '700' },
  // Monthly Section
  monthlySection: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  monthItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  monthName: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
  monthStats: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  monthTotal: { color: Colors.brand.pink, fontSize: 14, fontWeight: '700' },
  monthTx: { color: Colors.text.muted, fontSize: 11 },
});
