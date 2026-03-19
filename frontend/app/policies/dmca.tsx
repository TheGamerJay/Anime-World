import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function DMCAScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DMCA / Copyright</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: June 2025</Text>

        <View style={styles.warningBox}>
          <Ionicons name="warning" size={24} color={Colors.brand.warning} />
          <Text style={styles.warningText}>
            AnimeWorld is for ORIGINAL content only. Uploading copyrighted anime, manga, or other media without permission is strictly prohibited and will result in immediate account termination.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>📜 DMCA Policy</Text>
        <Text style={styles.paragraph}>
          AnimeWorld respects intellectual property rights and expects all users to do the same. We comply with the Digital Millennium Copyright Act (DMCA) and will respond promptly to valid takedown notices.
        </Text>

        <Text style={styles.sectionTitle}>🚨 Reporting Copyright Infringement</Text>
        <Text style={styles.paragraph}>
          If you believe your copyrighted work has been uploaded without authorization, submit a DMCA takedown notice with:{"\n\n"}
          1. Your physical or electronic signature{"\n"}
          2. Identification of the copyrighted work{"\n"}
          3. Identification of the infringing material (URL/link){"\n"}
          4. Your contact information{"\n"}
          5. A statement of good faith belief{"\n"}
          6. A statement under penalty of perjury
        </Text>

        <Text style={styles.subTitle}>Submit DMCA Notice To:</Text>
        <Text style={styles.contactBox}>
          DMCA Agent{"\n"}
          AnimeWorld{"\n"}
          Email: dmca@animeworld.app{"\n"}
          Subject: DMCA Takedown Notice
        </Text>

        <Text style={styles.sectionTitle}>⏱️ Response Timeline</Text>
        <Text style={styles.paragraph}>
          • We review DMCA notices within 24-48 hours{"\n"}
          • Infringing content is removed promptly{"\n"}
          • Uploaders are notified and given chance to respond{"\n"}
          • Repeat offenders are permanently banned
        </Text>

        <Text style={styles.sectionTitle}>⚖️ Counter-Notification</Text>
        <Text style={styles.paragraph}>
          If you believe your content was wrongly removed, you may file a counter-notification including:{"\n\n"}
          • Your physical or electronic signature{"\n"}
          • Identification of removed material{"\n"}
          • Statement under penalty of perjury that removal was a mistake{"\n"}
          • Your consent to jurisdiction{"\n"}
          • Your contact information
        </Text>

        <Text style={styles.sectionTitle}>🚫 Three-Strike Policy</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>First Strike:</Text> Content removed, warning issued{"\n"}
          • <Text style={styles.bold}>Second Strike:</Text> Content removed, 30-day upload restriction{"\n"}
          • <Text style={styles.bold}>Third Strike:</Text> Permanent account termination{"\n\n"}
          Strikes may be appealed within 14 days.
        </Text>

        <Text style={styles.sectionTitle}>✅ What IS Allowed</Text>
        <Text style={styles.paragraph}>
          • 100% original content you created{"\n"}
          • Content you have explicit rights to share{"\n"}
          • Fan art with transformative elements (with disclaimers){"\n"}
          • Parodies and commentary (fair use){"\n"}
          • Licensed content with proof of license
        </Text>

        <Text style={styles.sectionTitle}>❌ What is NOT Allowed</Text>
        <Text style={styles.paragraph}>
          • Reuploading existing anime episodes{"\n"}
          • Manga scans you didn't create{"\n"}
          • Movie clips or full movies{"\n"}
          • Music without license{"\n"}
          • Any content you don't have rights to
        </Text>

        <Text style={styles.sectionTitle}>📞 Questions?</Text>
        <Text style={styles.paragraph}>
          For copyright questions, email: copyright@animeworld.app{"\n\n"}
          For general legal inquiries: legal@animeworld.app
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
  lastUpdated: { fontSize: 12, color: Colors.text.muted, marginBottom: Spacing.md, fontStyle: 'italic' },
  warningBox: {
    flexDirection: 'row', backgroundColor: Colors.brand.warning + '20', padding: Spacing.md,
    borderRadius: Radius.md, gap: 12, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.brand.warning,
  },
  warningText: { flex: 1, color: Colors.brand.warning, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  subTitle: { fontSize: 15, fontWeight: '600', color: Colors.brand.cyan, marginTop: Spacing.md, marginBottom: 8 },
  paragraph: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
  bold: { fontWeight: '700', color: Colors.text.primary },
  contactBox: {
    backgroundColor: Colors.bg.surface, padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, fontSize: 14, color: Colors.text.primary, lineHeight: 22,
  },
});
