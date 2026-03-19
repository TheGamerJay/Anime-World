import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: June 2025</Text>

        <Text style={styles.sectionTitle}>📄 Agreement to Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using AnimeWorld ("the Platform"), you agree to be bound by these Terms of Service. AnimeWorld is a user-generated content platform for original anime, novels, and movies created by independent creators.
        </Text>

        <Text style={styles.sectionTitle}>👤 User Accounts</Text>
        <Text style={styles.paragraph}>
          • You must be at least 13 years old to use the Platform{"\n"}
          • You are responsible for maintaining account security{"\n"}
          • One account per person is allowed{"\n"}
          • You must provide accurate registration information{"\n"}
          • Account sharing is prohibited
        </Text>

        <Text style={styles.sectionTitle}>🎨 Creator Terms</Text>
        <Text style={styles.subTitle}>Content Ownership</Text>
        <Text style={styles.paragraph}>
          • You retain ownership of your original content{"\n"}
          • You grant AnimeWorld a license to display and distribute your content{"\n"}
          • You must have all rights to content you upload{"\n"}
          • Uploading copyrighted content without permission is prohibited
        </Text>

        <Text style={styles.subTitle}>Creator Responsibilities</Text>
        <Text style={styles.paragraph}>
          • Only upload ORIGINAL content you created{"\n"}
          • Do not upload copyrighted anime, manga, or other media{"\n"}
          • Properly label mature or sensitive content{"\n"}
          • Respond to copyright claims within 48 hours{"\n"}
          • Maintain accurate payment information for payouts
        </Text>

        <Text style={styles.subTitle}>Revenue & Payouts</Text>
        <Text style={styles.paragraph}>
          • Creators receive 80% of tips and subscriptions{"\n"}
          • Platform retains 20% as service fee{"\n"}
          • Minimum payout threshold: $10{"\n"}
          • Payouts processed via Stripe Connect{"\n"}
          • Tax reporting is your responsibility
        </Text>

        <Text style={styles.sectionTitle}>🚫 Prohibited Content</Text>
        <Text style={styles.paragraph}>
          The following content is strictly prohibited:{"\n\n"}
          • Copyrighted content you don't own{"\n"}
          • Content depicting minors inappropriately{"\n"}
          • Hate speech or discrimination{"\n"}
          • Graphic violence without proper warnings{"\n"}
          • Spam or misleading content{"\n"}
          • Malware or harmful code{"\n"}
          • Content violating any laws
        </Text>

        <Text style={styles.sectionTitle}>💳 Payments & Subscriptions</Text>
        <Text style={styles.paragraph}>
          • All payments are processed through Stripe{"\n"}
          • Subscriptions auto-renew unless cancelled{"\n"}
          • Refunds handled on a case-by-case basis{"\n"}
          • Tips are non-refundable{"\n"}
          • Premium memberships: $4.99/month
        </Text>

        <Text style={styles.sectionTitle}>⚠️ Account Termination</Text>
        <Text style={styles.paragraph}>
          We may suspend or terminate accounts for:{"\n\n"}
          • Violation of these terms{"\n"}
          • Copyright infringement{"\n"}
          • Fraudulent activity{"\n"}
          • Harassment of other users{"\n"}
          • Multiple reports of policy violations
        </Text>

        <Text style={styles.sectionTitle}>🛡️ Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          AnimeWorld is provided "as is" without warranties. We are not liable for:{"\n\n"}
          • User-generated content{"\n"}
          • Service interruptions{"\n"}
          • Data loss{"\n"}
          • Third-party actions{"\n"}
          • Indirect or consequential damages
        </Text>

        <Text style={styles.sectionTitle}>🔄 Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may update these terms at any time. Continued use after changes constitutes acceptance. Material changes will be notified via email or app notification.
        </Text>

        <Text style={styles.sectionTitle}>📧 Contact</Text>
        <Text style={styles.paragraph}>
          Questions about these terms?{"\n"}
          Email: legal@animeworld.app
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
});
