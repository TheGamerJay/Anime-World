import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: June 2025</Text>

        <Text style={styles.sectionTitle}>🔒 Introduction</Text>
        <Text style={styles.paragraph}>
          AnimeWorld ("we", "our", "us") is a user-generated content platform where creators can upload and share their original anime, novels, and movies. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
        </Text>

        <Text style={styles.sectionTitle}>📊 Information We Collect</Text>
        <Text style={styles.subTitle}>Account Information</Text>
        <Text style={styles.paragraph}>
          • Username and email address{"\n"}
          • Password (stored securely hashed){"\n"}
          • Profile information (bio, avatar color){"\n"}
          • Creator status and verification data
        </Text>

        <Text style={styles.subTitle}>Content & Activity</Text>
        <Text style={styles.paragraph}>
          • Content you upload (series, episodes, chapters){"\n"}
          • Viewing history and preferences{"\n"}
          • Likes, follows, and watchlist data{"\n"}
          • Comments and interactions
        </Text>

        <Text style={styles.subTitle}>Payment Information</Text>
        <Text style={styles.paragraph}>
          • Transaction history (tips, subscriptions){"\n"}
          • Payment method details (processed by Stripe){"\n"}
          • Creator payout information{"\n"}
          Note: Full payment details are handled by our payment processor (Stripe) and not stored on our servers.
        </Text>

        <Text style={styles.subTitle}>Technical Data</Text>
        <Text style={styles.paragraph}>
          • Device type and operating system{"\n"}
          • IP address and location data{"\n"}
          • Browser type and version{"\n"}
          • App usage analytics
        </Text>

        <Text style={styles.sectionTitle}>🎯 How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          • Provide and maintain the platform{"\n"}
          • Process payments and creator payouts{"\n"}
          • Personalize content recommendations{"\n"}
          • Communicate updates and notifications{"\n"}
          • Detect and prevent fraud or abuse{"\n"}
          • Comply with legal obligations{"\n"}
          • Improve our services through analytics
        </Text>

        <Text style={styles.sectionTitle}>🤝 Information Sharing</Text>
        <Text style={styles.paragraph}>
          We may share your information with:{"\n\n"}
          • <Text style={styles.bold}>Payment Processors:</Text> Stripe for handling transactions{"\n"}
          • <Text style={styles.bold}>Service Providers:</Text> Cloud hosting and analytics services{"\n"}
          • <Text style={styles.bold}>Legal Requirements:</Text> When required by law or to protect rights{"\n"}
          • <Text style={styles.bold}>Public Profile:</Text> Your username and public content are visible to all users
        </Text>

        <Text style={styles.sectionTitle}>🛡️ Creator Data</Text>
        <Text style={styles.paragraph}>
          As a creator, additional information is collected:{"\n\n"}
          • Content analytics and performance data{"\n"}
          • Earnings and payout history{"\n"}
          • Subscriber and follower information{"\n"}
          • Content metadata and upload history
        </Text>

        <Text style={styles.sectionTitle}>📱 Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:{"\n\n"}
          • Access your personal data{"\n"}
          • Correct inaccurate information{"\n"}
          • Delete your account and data{"\n"}
          • Export your data{"\n"}
          • Opt-out of marketing communications{"\n"}
          • Withdraw consent where applicable
        </Text>

        <Text style={styles.sectionTitle}>🔐 Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures including:{"\n\n"}
          • Encryption of data in transit and at rest{"\n"}
          • Secure password hashing{"\n"}
          • Regular security audits{"\n"}
          • Access controls and monitoring
        </Text>

        <Text style={styles.sectionTitle}>🌍 International Transfers</Text>
        <Text style={styles.paragraph}>
          Your data may be transferred to and processed in countries outside your own. We ensure appropriate safeguards are in place for such transfers.
        </Text>

        <Text style={styles.sectionTitle}>📧 Contact Us</Text>
        <Text style={styles.paragraph}>
          For privacy-related inquiries:{"\n"}
          Email: privacy@animeworld.app{"\n"}
          Or use the Contact Us page in the app.
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
