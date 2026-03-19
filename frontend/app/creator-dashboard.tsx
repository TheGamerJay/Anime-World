import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { analyticsAPI } from '../src/api';
import { useAuth } from '../src/AuthContext';

interface CreatorAnalytics {
  summary: {
    total_gross_revenue: number;
    total_platform_fee: number;
    total_net_revenue: number;
    tips_gross: number;
    channel_subs_gross: number;
    available_balance: number;
    total_supporters: number;
    total_transactions: number;
    total_views: number;
    total_likes: number;
    follower_count: number;
    series_count: number;
    platform_fee_percentage: number;
  };
  top_supporters: any[];
  recent_transactions: any[];
  monthly_breakdown: any[];
  series_performance: any[];
}

function formatMoney(amount: number): string {
  return '$' + amount.toFixed(2);
}

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
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

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'supporters' | 'transactions' | 'content'>('overview');

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await analyticsAPI.getCreatorAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.is_creator) loadAnalytics();
    else setLoading(false);
  }, [user?.is_creator, loadAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (!user?.is_creator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creator Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>Creator Analytics</Text>
          <Text style={styles.emptySubtext}>Become a creator to access your earnings dashboard</Text>
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
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.cyan} />}
      >
        {/* Revenue Hero Card */}
        <View style={styles.revenueCard}>
          <LinearGradient
            colors={[Colors.brand.cyan + '30', Colors.brand.pink + '30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.revenueLabel}>Available Balance</Text>
          <Text style={styles.revenueAmount}>{formatMoney(s?.available_balance || 0)}</Text>
          <View style={styles.revenueBreakdown}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueItemLabel}>Gross Revenue</Text>
              <Text style={styles.revenueItemValue}>{formatMoney(s?.total_gross_revenue || 0)}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueItem}>
              <Text style={styles.revenueItemLabel}>Platform Fee ({s?.platform_fee_percentage || 20}%)</Text>
              <Text style={[styles.revenueItemValue, { color: Colors.brand.error }]}>-{formatMoney(s?.total_platform_fee || 0)}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueItem}>
              <Text style={styles.revenueItemLabel}>Net Revenue</Text>
              <Text style={[styles.revenueItemValue, { color: Colors.brand.success }]}>{formatMoney(s?.total_net_revenue || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Income Breakdown */}
        <View style={styles.incomeSection}>
          <Text style={styles.sectionTitle}>Income Sources</Text>
          <View style={styles.incomeRow}>
            <View style={[styles.incomeCard, { borderLeftColor: Colors.brand.warning }]}>
              <Ionicons name="gift" size={24} color={Colors.brand.warning} />
              <Text style={styles.incomeAmount}>{formatMoney(s?.tips_gross || 0)}</Text>
              <Text style={styles.incomeLabel}>Tips</Text>
            </View>
            <View style={[styles.incomeCard, { borderLeftColor: Colors.brand.cyan }]}>
              <Ionicons name="people" size={24} color={Colors.brand.cyan} />
              <Text style={styles.incomeAmount}>{formatMoney(s?.channel_subs_gross || 0)}</Text>
              <Text style={styles.incomeLabel}>Subscriptions</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Supporters" value={formatCount(s?.total_supporters || 0)} color={Colors.brand.pink} icon="heart" />
          <StatCard label="Transactions" value={formatCount(s?.total_transactions || 0)} color={Colors.brand.cyan} icon="receipt" />
          <StatCard label="Total Views" value={formatCount(s?.total_views || 0)} color={Colors.brand.accent} icon="eye" />
          <StatCard label="Followers" value={formatCount(s?.follower_count || 0)} color={Colors.brand.success} icon="people" />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['supporters', 'transactions', 'content'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'supporters' ? 'Top Supporters' : tab === 'transactions' ? 'Transactions' : 'Content'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'supporters' && (
          <View style={styles.tabContent}>
            {(analytics?.top_supporters || []).length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="heart-outline" size={40} color={Colors.text.muted} />
                <Text style={styles.emptyTabText}>No supporters yet</Text>
              </View>
            ) : (
              (analytics?.top_supporters || []).map((supporter, index) => (
                <View key={supporter.user_id} style={styles.supporterItem}>
                  <View style={styles.supporterRank}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <LinearGradient
                    colors={[supporter.avatar_color, supporter.avatar_color + '60']}
                    style={styles.supporterAvatar}
                  >
                    <View style={styles.supporterAvatarInner}>
                      <Text style={[styles.supporterInitial, { color: supporter.avatar_color }]}>
                        {supporter.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </LinearGradient>
                  <View style={styles.supporterInfo}>
                    <Text style={styles.supporterName}>{supporter.username}</Text>
                    <Text style={styles.supporterStats}>
                      {supporter.transaction_count} transaction{supporter.transaction_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.supporterAmount}>
                    <Text style={styles.supporterTotal}>{formatMoney(supporter.total_amount)}</Text>
                    <Text style={styles.supporterBreakdown}>
                      Tips: {formatMoney(supporter.tips_amount)} | Subs: {formatMoney(supporter.subs_amount)}
                    </Text>
                  </View>
                </View>
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
                  <View style={[styles.txTypeIcon, { backgroundColor: tx.type === 'tip' ? Colors.brand.warning + '20' : Colors.brand.cyan + '20' }]}>
                    <Ionicons
                      name={tx.type === 'tip' ? 'gift' : 'people'}
                      size={18}
                      color={tx.type === 'tip' ? Colors.brand.warning : Colors.brand.cyan}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txFrom}>{tx.supporter_username}</Text>
                    <Text style={styles.txType}>{tx.type === 'tip' ? 'Tip' : 'Channel Sub'}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                  </View>
                  <View style={styles.txAmounts}>
                    <Text style={styles.txGross}>{formatMoney(tx.gross_amount)}</Text>
                    <Text style={styles.txFee}>Fee: -{formatMoney(tx.platform_fee)}</Text>
                    <Text style={styles.txNet}>Net: {formatMoney(tx.net_amount)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'content' && (
          <View style={styles.tabContent}>
            {(analytics?.series_performance || []).length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="film-outline" size={40} color={Colors.text.muted} />
                <Text style={styles.emptyTabText}>No content yet</Text>
              </View>
            ) : (
              (analytics?.series_performance || []).map((series) => (
                <TouchableOpacity
                  key={series.id}
                  onPress={() => router.push(`/series/${series.id}`)}
                  style={styles.contentItem}
                >
                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle} numberOfLines={1}>{series.title}</Text>
                    <Text style={styles.contentGenre}>{series.genre}</Text>
                  </View>
                  <View style={styles.contentStats}>
                    <View style={styles.contentStat}>
                      <Ionicons name="eye" size={14} color={Colors.text.muted} />
                      <Text style={styles.contentStatText}>{formatCount(series.view_count)}</Text>
                    </View>
                    <View style={styles.contentStat}>
                      <Ionicons name="heart" size={14} color={Colors.brand.pink} />
                      <Text style={styles.contentStatText}>{formatCount(series.like_count)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Monthly Breakdown */}
        <View style={styles.monthlySection}>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          {(analytics?.monthly_breakdown || []).map((month) => (
            <View key={month.month} style={styles.monthItem}>
              <Text style={styles.monthName}>{month.month}</Text>
              <View style={styles.monthStats}>
                <Text style={styles.monthGross}>Gross: {formatMoney(month.gross_revenue)}</Text>
                <Text style={styles.monthNet}>Net: {formatMoney(month.net_revenue)}</Text>
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
  // Revenue Card
  revenueCard: {
    margin: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  revenueLabel: { color: Colors.text.muted, fontSize: 14, marginBottom: 4 },
  revenueAmount: { fontSize: 42, fontWeight: '800', color: Colors.text.primary },
  revenueBreakdown: { marginTop: Spacing.lg, gap: 12 },
  revenueItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueItemLabel: { color: Colors.text.secondary, fontSize: 13 },
  revenueItemValue: { color: Colors.text.primary, fontSize: 15, fontWeight: '700' },
  revenueDivider: { height: 1, backgroundColor: Colors.border },
  // Income Section
  incomeSection: { paddingHorizontal: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.sm },
  incomeRow: { flexDirection: 'row', gap: 12 },
  incomeCard: {
    flex: 1, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: Colors.border,
  },
  incomeAmount: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, marginTop: 8 },
  incomeLabel: { color: Colors.text.muted, fontSize: 12, marginTop: 4 },
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md, gap: 12 },
  statCard: {
    width: '47%', backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  statLabel: { color: Colors.text.muted, fontSize: 12, marginTop: 2 },
  // Tabs
  tabsContainer: { flexDirection: 'row', marginHorizontal: Spacing.md, marginTop: Spacing.md, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md, backgroundColor: Colors.bg.surface },
  tabActive: { backgroundColor: Colors.brand.cyanDim },
  tabText: { color: Colors.text.muted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: Colors.brand.cyan },
  tabContent: { marginHorizontal: Spacing.md, marginTop: Spacing.md },
  emptyTab: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTabText: { color: Colors.text.muted, fontSize: 14 },
  // Supporter Item
  supporterItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  supporterRank: { width: 28, alignItems: 'center' },
  rankText: { color: Colors.brand.warning, fontSize: 12, fontWeight: '800' },
  supporterAvatar: { width: 40, height: 40, borderRadius: 20, padding: 2, marginRight: 10 },
  supporterAvatarInner: { flex: 1, borderRadius: 18, backgroundColor: Colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  supporterInitial: { fontSize: 14, fontWeight: '800' },
  supporterInfo: { flex: 1 },
  supporterName: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
  supporterStats: { color: Colors.text.muted, fontSize: 11 },
  supporterAmount: { alignItems: 'flex-end' },
  supporterTotal: { color: Colors.brand.success, fontSize: 16, fontWeight: '800' },
  supporterBreakdown: { color: Colors.text.muted, fontSize: 10 },
  // Transaction Item
  transactionItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  txTypeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  txInfo: { flex: 1 },
  txFrom: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
  txType: { color: Colors.text.muted, fontSize: 11 },
  txDate: { color: Colors.text.muted, fontSize: 10 },
  txAmounts: { alignItems: 'flex-end' },
  txGross: { color: Colors.text.primary, fontSize: 14, fontWeight: '700' },
  txFee: { color: Colors.brand.error, fontSize: 10 },
  txNet: { color: Colors.brand.success, fontSize: 11, fontWeight: '600' },
  // Content Item
  contentItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.bg.surface, borderRadius: Radius.md,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  contentInfo: { flex: 1, marginRight: Spacing.md },
  contentTitle: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
  contentGenre: { color: Colors.brand.pink, fontSize: 11 },
  contentStats: { flexDirection: 'row', gap: 12 },
  contentStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contentStatText: { color: Colors.text.muted, fontSize: 12 },
  // Monthly Section
  monthlySection: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  monthItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  monthName: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
  monthStats: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  monthGross: { color: Colors.text.secondary, fontSize: 12 },
  monthNet: { color: Colors.brand.success, fontSize: 12, fontWeight: '600' },
  monthTx: { color: Colors.text.muted, fontSize: 11 },
});
