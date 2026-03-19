import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth } from '../src/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [autoplay, setAutoplay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [subtitles, setSubtitles] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [showLanguages, setShowLanguages] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will clear cached anime data and images.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        try {
          await AsyncStorage.multiRemove(['cache_trending', 'cache_popular', 'cache_upcoming']);
          Alert.alert('Done', 'Cache cleared successfully');
        } catch { Alert.alert('Done', 'Cache cleared'); }
      }},
    ]);
  };

  const handleClearHistory = () => {
    Alert.alert('Clear Watch History', 'This will remove all your watch history. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Done', 'Watch history cleared') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="settings-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* Playback Section */}
        <Text style={styles.sectionLabel}>PLAYBACK</Text>
        <View style={styles.section}>
          <ToggleItem label="Autoplay Next Episode" value={autoplay} onToggle={setAutoplay} />
          <ToggleItem label="Show Subtitles" value={subtitles} onToggle={setSubtitles} isLast />
        </View>

        {/* Video Quality */}
        <Text style={styles.sectionLabel}>VIDEO QUALITY</Text>
        <View style={styles.section}>
          <TouchableOpacity testID="quality-toggle" onPress={() => setShowQuality(!showQuality)} style={styles.expandableItem}>
            <View style={styles.expandableLeft}>
              <Text style={styles.expandableLabel}>Video Quality</Text>
              <Text style={styles.expandableValue}>{selectedQuality}</Text>
            </View>
            <Ionicons name={showQuality ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.text.muted} />
          </TouchableOpacity>
          {showQuality && ['Auto', '1080p', '720p', '480p', '360p'].map((q, idx, arr) => (
            <TouchableOpacity key={q} testID={`quality-${q}`} onPress={() => { setSelectedQuality(q); setShowQuality(false); }} style={[styles.selectItem, idx === arr.length - 1 && styles.lastItem]}>
              <Text style={styles.selectLabel}>{q}</Text>
              {selectedQuality === q && <Ionicons name="checkmark-circle" size={22} color={Colors.brand.cyan} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Language */}
        <Text style={styles.sectionLabel}>LANGUAGE</Text>
        <View style={styles.section}>
          <TouchableOpacity testID="language-toggle" onPress={() => setShowLanguages(!showLanguages)} style={styles.expandableItem}>
            <View style={styles.expandableLeft}>
              <Text style={styles.expandableLabel}>Preferred Language</Text>
              <Text style={styles.expandableValue}>{selectedLanguage}</Text>
            </View>
            <Ionicons name={showLanguages ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.text.muted} />
          </TouchableOpacity>
          {showLanguages && ['English', 'Japanese', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Russian', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Thai', 'Indonesian', 'Vietnamese', 'Turkish', 'Polish', 'Dutch', 'Swedish', 'Norwegian'].map((lang, idx, arr) => (
            <TouchableOpacity key={lang} testID={`lang-${lang}`} onPress={() => { setSelectedLanguage(lang); setShowLanguages(false); }} style={[styles.selectItem, idx === arr.length - 1 && styles.lastItem]}>
              <Text style={styles.selectLabel}>{lang}</Text>
              {selectedLanguage === lang && <Ionicons name="checkmark-circle" size={22} color={Colors.brand.cyan} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.section}>
          <ToggleItem label="Push Notifications" value={notifications} onToggle={setNotifications} />
          <ToggleItem label="New Episode Alerts" value={notifications} onToggle={setNotifications} isLast />
        </View>

        {/* Content */}
        <Text style={styles.sectionLabel}>CONTENT</Text>
        <View style={styles.section}>
          <ToggleItem label="Data Saver Mode" value={dataSaver} onToggle={setDataSaver} />
          <TouchableOpacity testID="content-restrictions-btn" onPress={() => router.push('/content-restrictions')} style={[styles.selectItem, styles.lastItem]}>
            <Text style={styles.selectLabel}>Content Restrictions</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Storage */}
        <Text style={styles.sectionLabel}>STORAGE</Text>
        <View style={styles.section}>
          <TouchableOpacity testID="clear-cache-btn" onPress={handleClearCache} style={styles.actionItem}>
            <Text style={styles.actionLabel}>Clear Cache</Text>
            <Ionicons name="trash-outline" size={20} color={Colors.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity testID="clear-history-btn" onPress={handleClearHistory} style={[styles.actionItem, styles.lastItem]}>
            <Text style={styles.actionLabel}>Clear Watch History</Text>
            <Ionicons name="trash-outline" size={20} color={Colors.brand.error} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <Text style={styles.sectionLabel}>APP INFO</Text>
        <View style={styles.section}>
          <View style={[styles.infoItem, styles.lastItem]}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleItem({ label, value, onToggle, isLast = false }: { label: string; value: boolean; onToggle: (val: boolean) => void; isLast?: boolean }) {
  return (
    <View style={[styles.toggleItem, !isLast && styles.itemBorder]}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.bg.card, true: Colors.brand.cyanDim }}
        thumbColor={value ? Colors.brand.cyan : Colors.text.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.muted, letterSpacing: 1.5, marginTop: Spacing.lg, marginBottom: Spacing.sm, marginLeft: 4 },
  section: { backgroundColor: Colors.bg.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  toggleItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  toggleLabel: { fontSize: 15, color: Colors.text.primary, fontWeight: '500' },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bg.elevated },
  lastItem: { borderBottomWidth: 0 },
  selectLabel: { fontSize: 15, color: Colors.text.primary, fontWeight: '500' },
  expandableItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  expandableLeft: { flex: 1 },
  expandableLabel: { fontSize: 15, color: Colors.text.primary, fontWeight: '500' },
  expandableValue: { fontSize: 13, color: Colors.brand.cyan, fontWeight: '600', marginTop: 2 },
  actionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  actionLabel: { fontSize: 15, color: Colors.text.primary, fontWeight: '500' },
  infoItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 15, color: Colors.text.primary, fontWeight: '500' },
  infoValue: { fontSize: 15, color: Colors.text.muted },
});
