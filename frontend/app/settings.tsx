import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth } from '../src/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Cache has been cleared successfully.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Playback Settings */}
        <Text style={styles.sectionTitle}>Playback</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="play-circle-outline" size={22} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>Autoplay Next Episode</Text>
            </View>
            <Switch
              value={autoplay}
              onValueChange={setAutoplay}
              trackColor={{ false: Colors.bg.card, true: Colors.brand.cyanDim }}
              thumbColor={autoplay ? Colors.brand.cyan : Colors.text.muted}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="cellular-outline" size={22} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>Data Saver</Text>
            </View>
            <Switch
              value={dataSaver}
              onValueChange={setDataSaver}
              trackColor={{ false: Colors.bg.card, true: Colors.brand.cyanDim }}
              thumbColor={dataSaver ? Colors.brand.cyan : Colors.text.muted}
            />
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.bg.card, true: Colors.brand.cyanDim }}
              thumbColor={notifications ? Colors.brand.cyan : Colors.text.muted}
            />
          </View>
        </View>

        {/* Storage */}
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity onPress={handleClearCache} style={styles.settingItemBtn}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={22} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>Clear Cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>App Version</Text>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: Colors.text.muted, letterSpacing: 1,
    textTransform: 'uppercase', marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  settingsGroup: {
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 16, color: Colors.text.primary, fontWeight: '500' },
  settingValue: { fontSize: 14, color: Colors.text.muted },
});
