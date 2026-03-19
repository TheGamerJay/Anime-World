import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth } from '../src/AuthContext';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>No Watch History</Text>
          <Text style={styles.emptySubtext}>
            {user ? 'Episodes you watch will appear here' : 'Sign in to track your watch history'}
          </Text>
        </View>
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
  content: { flexGrow: 1, paddingHorizontal: Spacing.md },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  emptySubtext: { fontSize: 14, color: Colors.text.muted, textAlign: 'center' },
});
