import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="terms-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: March 18, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By downloading, installing, accessing, or using the Anime World mobile application and related services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Service.
        </Text>
        <Text style={styles.body}>
          We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service constitutes acceptance of the modified Terms.
        </Text>

        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 13 years old to use the Service. If you are under 18, you represent that you have your parent or guardian's permission to use the Service. By using the Service, you represent and warrant that you meet all eligibility requirements.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.body}>
          {'\u2022'} You are responsible for maintaining the confidentiality of your account credentials{'\n'}
          {'\u2022'} You are responsible for all activities that occur under your account{'\n'}
          {'\u2022'} You must provide accurate and complete information during registration{'\n'}
          {'\u2022'} You must notify us immediately of any unauthorized use of your account{'\n'}
          {'\u2022'} We reserve the right to suspend or terminate accounts that violate these Terms{'\n'}
          {'\u2022'} One person may not maintain more than one account
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use Policy</Text>
        <Text style={styles.body}>
          You agree NOT to:{'\n'}
          {'\u2022'} Use the Service for any illegal purpose or in violation of any applicable law{'\n'}
          {'\u2022'} Upload, transmit, or distribute harmful, offensive, or objectionable content{'\n'}
          {'\u2022'} Attempt to gain unauthorized access to the Service or its related systems{'\n'}
          {'\u2022'} Interfere with or disrupt the Service or servers connected to the Service{'\n'}
          {'\u2022'} Use any automated means (bots, scrapers, crawlers) to access the Service{'\n'}
          {'\u2022'} Reverse engineer, decompile, or disassemble any portion of the Service{'\n'}
          {'\u2022'} Circumvent, disable, or interfere with security features of the Service{'\n'}
          {'\u2022'} Impersonate any person or entity{'\n'}
          {'\u2022'} Harvest or collect user information without consent{'\n'}
          {'\u2022'} Use the Service to distribute spam, malware, or phishing content{'\n'}
          {'\u2022'} Reproduce, distribute, or create derivative works of the Service content
        </Text>

        <Text style={styles.sectionTitle}>5. Content and Intellectual Property</Text>
        <Text style={styles.body}>
          All content available through the Service, including but not limited to text, graphics, logos, images, audio clips, video clips, data compilations, and software, is the property of Anime World or its content suppliers and is protected by international copyright, trademark, and other intellectual property laws.
        </Text>
        <Text style={styles.body}>
          Anime data, images, and information displayed in the Service are sourced from third-party APIs and belong to their respective owners. We do not claim ownership of third-party content.
        </Text>

        <Text style={styles.sectionTitle}>6. User-Generated Content</Text>
        <Text style={styles.body}>
          By submitting content to the Service (reviews, comments, ratings), you grant us a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, and display such content in connection with the Service. You represent that you own or have the necessary rights to submit such content.
        </Text>

        <Text style={styles.sectionTitle}>7. Third-Party Services and Advertising</Text>
        <Text style={styles.body}>
          The Service may contain advertisements provided by third parties, including Google AdSense. We are not responsible for the content of third-party advertisements. Your interactions with advertisers are solely between you and the advertiser.
        </Text>
        <Text style={styles.body}>
          The Service may contain links to third-party websites or services that are not owned or controlled by Anime World. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
        </Text>

        <Text style={styles.sectionTitle}>8. Disclaimer of Warranties</Text>
        <Text style={styles.body}>
          THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND COURSE OF DEALING.
        </Text>
        <Text style={styles.body}>
          WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. WE DO NOT WARRANT THE ACCURACY OR COMPLETENESS OF ANY INFORMATION PROVIDED THROUGH THE SERVICE.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.body}>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ANIME WORLD, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:{'\n'}
          {'\u2022'} Your access to or use of (or inability to access or use) the Service{'\n'}
          {'\u2022'} Any conduct or content of any third party on the Service{'\n'}
          {'\u2022'} Any content obtained from the Service{'\n'}
          {'\u2022'} Unauthorized access, use, or alteration of your transmissions or content
        </Text>

        <Text style={styles.sectionTitle}>10. Indemnification</Text>
        <Text style={styles.body}>
          You agree to defend, indemnify, and hold harmless Anime World and its officers, directors, employees, contractors, agents, licensors, and suppliers from and against any claims, actions, demands, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Service, your violation of these Terms, or your violation of any rights of another.
        </Text>

        <Text style={styles.sectionTitle}>11. Termination</Text>
        <Text style={styles.body}>
          We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately. All provisions of these Terms that should survive termination shall survive.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law and Dispute Resolution</Text>
        <Text style={styles.body}>
          These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
        </Text>

        <Text style={styles.sectionTitle}>13. Severability</Text>
        <Text style={styles.body}>
          If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
        </Text>

        <Text style={styles.sectionTitle}>14. Entire Agreement</Text>
        <Text style={styles.body}>
          These Terms, together with the Privacy Policy and any other legal notices published by us on the Service, constitute the entire agreement between you and Anime World concerning the Service.
        </Text>

        <Text style={styles.sectionTitle}>15. Contact Information</Text>
        <Text style={styles.body}>
          For questions about these Terms of Service, please contact us at:{'\n'}
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
  body: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing.sm },
});
