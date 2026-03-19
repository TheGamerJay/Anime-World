import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="privacy-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: March 18, 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.body}>
          Welcome to Anime World ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services (collectively, the "Service").
        </Text>
        <Text style={styles.body}>
          By accessing or using the Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.subTitle}>2.1 Personal Information</Text>
        <Text style={styles.body}>
          When you register for an account, we may collect:{'\n'}
          {'\u2022'} Username{'\n'}
          {'\u2022'} Email address{'\n'}
          {'\u2022'} Password (stored in encrypted/hashed form){'\n'}
          {'\u2022'} Profile information you choose to provide
        </Text>
        <Text style={styles.subTitle}>2.2 Usage Data</Text>
        <Text style={styles.body}>
          We automatically collect certain information when you use the Service:{'\n'}
          {'\u2022'} Device information (device type, operating system, unique device identifiers){'\n'}
          {'\u2022'} Log data (access times, pages viewed, IP address){'\n'}
          {'\u2022'} Anime browsing history and watchlist data{'\n'}
          {'\u2022'} Search queries within the app{'\n'}
          {'\u2022'} App interaction data (features used, time spent)
        </Text>
        <Text style={styles.subTitle}>2.3 Cookies and Tracking Technologies</Text>
        <Text style={styles.body}>
          We and our third-party partners may use cookies, web beacons, pixel tags, and similar tracking technologies to collect information about your interactions with the Service. This includes information collected by third-party advertising partners such as Google AdSense.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use the information we collect for the following purposes:{'\n'}
          {'\u2022'} To provide, operate, and maintain the Service{'\n'}
          {'\u2022'} To create and manage your user account{'\n'}
          {'\u2022'} To personalize your experience and deliver content relevant to your interests{'\n'}
          {'\u2022'} To process and manage your watchlist and viewing history{'\n'}
          {'\u2022'} To communicate with you about updates, security alerts, and support{'\n'}
          {'\u2022'} To serve personalized advertisements through third-party ad networks{'\n'}
          {'\u2022'} To analyze usage patterns and improve the Service{'\n'}
          {'\u2022'} To detect, prevent, and address technical issues and security threats{'\n'}
          {'\u2022'} To comply with legal obligations
        </Text>

        <Text style={styles.sectionTitle}>4. Third-Party Advertising</Text>
        <Text style={styles.body}>
          We may use third-party advertising companies, including Google AdSense, to serve ads when you use our Service. These companies may use information about your visits to this and other websites and apps in order to provide advertisements about goods and services of interest to you.
        </Text>
        <Text style={styles.body}>
          Google, as a third-party vendor, uses cookies to serve ads on our Service. Google's use of the DART cookie enables it to serve ads based on your visits to our Service and other sites on the Internet. You may opt out of the use of the DART cookie by visiting the Google Ad and Content Network Privacy Policy at https://policies.google.com/technologies/ads.
        </Text>
        <Text style={styles.body}>
          For more information about how Google uses data when you use our partners' sites or apps, visit https://policies.google.com/privacy.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Sharing and Disclosure</Text>
        <Text style={styles.body}>
          We may share your information in the following circumstances:{'\n'}
          {'\u2022'} With third-party service providers who assist in operating the Service{'\n'}
          {'\u2022'} With advertising partners (e.g., Google AdSense) for ad personalization{'\n'}
          {'\u2022'} With analytics providers to understand usage patterns{'\n'}
          {'\u2022'} To comply with legal obligations, court orders, or governmental requests{'\n'}
          {'\u2022'} To protect and defend our rights and property{'\n'}
          {'\u2022'} In connection with a merger, acquisition, or sale of assets{'\n'}
          {'\u2022'} With your consent or at your direction
        </Text>

        <Text style={styles.sectionTitle}>6. Data Security</Text>
        <Text style={styles.body}>
          We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption of passwords, secure data transmission, and regular security assessments. However, no method of transmission over the Internet or electronic storage is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.body}>
          We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements. When data is no longer needed, we will securely delete or anonymize it.
        </Text>

        <Text style={styles.sectionTitle}>8. Your Rights and Choices</Text>
        <Text style={styles.body}>
          Depending on your location, you may have the following rights:{'\n'}
          {'\u2022'} Access: Request a copy of the personal data we hold about you{'\n'}
          {'\u2022'} Correction: Request correction of inaccurate personal data{'\n'}
          {'\u2022'} Deletion: Request deletion of your personal data{'\n'}
          {'\u2022'} Portability: Request transfer of your data to another service{'\n'}
          {'\u2022'} Opt-Out: Opt out of personalized advertising{'\n'}
          {'\u2022'} Withdraw Consent: Withdraw consent for data processing{'\n'}
          {'\n'}To exercise these rights, please contact us at contact@animeworld.com.
        </Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.body}>
          The Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal data from a child under 13, we will take steps to delete such information. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
        </Text>

        <Text style={styles.sectionTitle}>10. International Data Transfers</Text>
        <Text style={styles.body}>
          Your information may be transferred to and processed in countries other than the country in which you reside. These countries may have data protection laws that are different from those of your country. We take appropriate safeguards to ensure that your personal information remains protected.
        </Text>

        <Text style={styles.sectionTitle}>11. California Privacy Rights (CCPA)</Text>
        <Text style={styles.body}>
          If you are a California resident, you have the right to request disclosure of the categories and specific pieces of personal information collected, request deletion of your personal information, and opt out of the sale of your personal information. We do not sell personal information.
        </Text>

        <Text style={styles.sectionTitle}>12. European Privacy Rights (GDPR)</Text>
        <Text style={styles.body}>
          If you are a resident of the European Economic Area (EEA), you have additional rights under the GDPR including the right to access, rectify, erase, restrict processing, object to processing, and data portability. Our legal basis for processing includes consent, contractual necessity, and legitimate interests.
        </Text>

        <Text style={styles.sectionTitle}>13. Changes to This Privacy Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the Service after any changes constitutes your acceptance of the updated Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>14. Contact Us</Text>
        <Text style={styles.body}>
          If you have any questions or concerns about this Privacy Policy, please contact us at:{'\n'}
          {'\n'}Email: contact@animeworld.com{'\n'}
          {'\n'}Anime World{'\n'}
          United States
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  lastUpdated: { fontSize: 13, color: Colors.brand.cyan, fontWeight: '600', marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  subTitle: { fontSize: 15, fontWeight: '600', color: Colors.brand.pink, marginTop: Spacing.md, marginBottom: Spacing.xs },
  body: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing.sm },
});
