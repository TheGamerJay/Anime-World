import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function CookiePolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cookie Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: June 2025</Text>

        <Text style={styles.sectionTitle}>🍪 What Are Cookies?</Text>
        <Text style={styles.paragraph}>
          Cookies are small text files stored on your device when you use our platform. They help us provide a better experience by remembering your preferences and login status.
        </Text>

        <Text style={styles.sectionTitle}>📊 Types of Cookies We Use</Text>
        
        <Text style={styles.subTitle}>✅ Essential Cookies</Text>
        <Text style={styles.paragraph}>
          Required for the platform to function. These cannot be disabled.{"\n"}
          • Authentication tokens{"\n"}
          • Session management{"\n"}
          • Security features{"\n"}
          • Load balancing
        </Text>

        <Text style={styles.subTitle}>📊 Analytics Cookies</Text>
        <Text style={styles.paragraph}>
          Help us understand how users interact with the platform.{"\n"}
          • Page views and navigation{"\n"}
          • Feature usage{"\n"}
          • Error tracking{"\n"}
          • Performance monitoring
        </Text>

        <Text style={styles.subTitle}>⚙️ Preference Cookies</Text>
        <Text style={styles.paragraph}>
          Remember your settings and preferences.{"\n"}
          • Language preferences{"\n"}
          • Theme settings{"\n"}
          • Playback preferences{"\n"}
          • Content filters
        </Text>

        <Text style={styles.subTitle}>🎯 Personalization Cookies</Text>
        <Text style={styles.paragraph}>
          Used to personalize your experience.{"\n"}
          • Content recommendations{"\n"}
          • Creator suggestions{"\n"}
          • Watch history
        </Text>

        <Text style={styles.sectionTitle}>📱 Mobile App Storage</Text>
        <Text style={styles.paragraph}>
          In our mobile app, we use similar technologies:{"\n\n"}
          • <Text style={styles.bold}>AsyncStorage:</Text> For storing preferences locally{"\n"}
          • <Text style={styles.bold}>SecureStore:</Text> For sensitive data like auth tokens{"\n"}
          • <Text style={styles.bold}>Cache:</Text> For offline content access
        </Text>

        <Text style={styles.sectionTitle}>🤝 Third-Party Cookies</Text>
        <Text style={styles.paragraph}>
          We use services that may set their own cookies:{"\n\n"}
          • <Text style={styles.bold}>Stripe:</Text> Payment processing{"\n"}
          • <Text style={styles.bold}>Analytics:</Text> Usage tracking{"\n"}
          • <Text style={styles.bold}>CDN:</Text> Content delivery
        </Text>

        <Text style={styles.sectionTitle}>🔧 Managing Cookies</Text>
        <Text style={styles.paragraph}>
          You can control cookies through:{"\n\n"}
          • Browser settings to block/delete cookies{"\n"}
          • App settings for preferences{"\n"}
          • Device settings for app data{"\n\n"}
          Note: Disabling essential cookies may prevent the platform from working correctly.
        </Text>

        <Text style={styles.sectionTitle}>🔄 Updates</Text>
        <Text style={styles.paragraph}>
          We may update this policy as our platform evolves. Check back periodically for changes.
        </Text>

        <Text style={styles.sectionTitle}>📧 Questions?</Text>
        <Text style={styles.paragraph}>
          Contact us at: privacy@animeworld.app
        </Text>

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
  content: { flex: 1, padding: Spacing.md },
  lastUpdated: { fontSize: 12, color: Colors.text.muted, marginBottom: Spacing.lg, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  subTitle: { fontSize: 15, fontWeight: '600', color: Colors.brand.cyan, marginTop: Spacing.md, marginBottom: 4 },
  paragraph: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
  bold: { fontWeight: '700', color: Colors.text.primary },
});
