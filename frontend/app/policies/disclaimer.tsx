import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme';

export default function DisclaimerScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="disclaimer-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disclaimer</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: March 18, 2026</Text>

        <Text style={styles.sectionTitle}>General Disclaimer</Text>
        <Text style={styles.body}>
          The information provided by Anime World ("we," "us," or "our") on our mobile application (the "Service") is for general informational and entertainment purposes only. All information on the Service is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Service.
        </Text>

        <Text style={styles.sectionTitle}>Content Disclaimer</Text>
        <Text style={styles.body}>
          Anime World is an anime information and discovery platform. We do not host, stream, or distribute any copyrighted anime content. All anime data, images, synopses, and metadata displayed within the Service are sourced from third-party APIs (including MyAnimeList via the Jikan API) and belong to their respective copyright holders, studios, and creators.
        </Text>
        <Text style={styles.body}>
          We do not claim ownership of any anime content, images, trademarks, or intellectual property displayed in the Service. All trademarks, registered trademarks, and service marks mentioned in the Service are the property of their respective owners.
        </Text>

        <Text style={styles.sectionTitle}>No Professional Advice</Text>
        <Text style={styles.body}>
          The Service does not provide professional, legal, financial, or medical advice. Any ratings, reviews, or recommendations within the Service are for entertainment and informational purposes only and should not be relied upon as professional advice.
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Content and Links</Text>
        <Text style={styles.body}>
          The Service may contain links to or content from third-party websites, services, and advertisers that are not owned or controlled by Anime World. We have no control over and assume no responsibility for the content, privacy policies, terms of service, or practices of any third-party websites or services. We do not warrant the offerings of any third-party entities or individuals.
        </Text>

        <Text style={styles.sectionTitle}>Advertising Disclaimer</Text>
        <Text style={styles.body}>
          The Service may display advertisements served by third-party advertising networks, including Google AdSense. These advertisements may be targeted based on your browsing history and interests. The presence of advertisements does not constitute an endorsement of the advertised products or services by Anime World.
        </Text>
        <Text style={styles.body}>
          We are not responsible for the content, accuracy, or opinions expressed in advertisements. Any transactions between you and advertisers found on or through the Service are solely between you and the advertiser.
        </Text>

        <Text style={styles.sectionTitle}>Affiliate Disclaimer</Text>
        <Text style={styles.body}>
          The Service may contain affiliate links. If you click on an affiliate link and make a purchase, we may receive a commission at no additional cost to you. We only recommend products and services that we believe will provide value to our users. However, this does not influence our content or recommendations.
        </Text>

        <Text style={styles.sectionTitle}>Fair Use Notice</Text>
        <Text style={styles.body}>
          This Service may contain copyrighted material, the use of which may not have been specifically authorized by the copyright owner. We believe this constitutes a "fair use" of such copyrighted material as provided for in Section 107 of the U.S. Copyright Law. The material on this Service is provided for informational, educational, and entertainment purposes.
        </Text>

        <Text style={styles.sectionTitle}>Limitation of Liability</Text>
        <Text style={styles.body}>
          UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SERVICE OR RELIANCE ON ANY INFORMATION PROVIDED ON THE SERVICE. YOUR USE OF THE SERVICE AND YOUR RELIANCE ON ANY INFORMATION ON THE SERVICE IS SOLELY AT YOUR OWN RISK.
        </Text>

        <Text style={styles.sectionTitle}>Accuracy of Information</Text>
        <Text style={styles.body}>
          While we strive to provide accurate and up-to-date information, we cannot guarantee the accuracy, completeness, or timeliness of the information presented. Anime details, episode counts, air dates, and other data are sourced from third-party providers and may contain errors or be outdated.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Disclaimer</Text>
        <Text style={styles.body}>
          We reserve the right to update or change this Disclaimer at any time. Any changes will be posted on this page with an updated revision date. Your continued use of the Service after any changes constitutes acceptance of the updated Disclaimer.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>
          If you have questions about this Disclaimer, please contact us at contact@animeworld.com.
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
