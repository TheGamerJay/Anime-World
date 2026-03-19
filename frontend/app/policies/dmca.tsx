import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme';

export default function DMCAScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="dmca-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DMCA / Copyright</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: March 18, 2026</Text>

        <Text style={styles.sectionTitle}>DMCA Copyright Policy</Text>
        <Text style={styles.body}>
          Anime World ("we," "us," or "our") respects the intellectual property rights of others and expects our users to do the same. We are committed to responding to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA) and other applicable intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>Copyright Notice</Text>
        <Text style={styles.body}>
          All anime content, images, trademarks, logos, and metadata displayed within the Anime World application are the property of their respective copyright holders, including but not limited to anime studios, production companies, manga publishers, and content distributors. Anime World does not claim ownership of any third-party content.
        </Text>
        <Text style={styles.body}>
          Anime data and images are sourced from publicly available APIs (such as MyAnimeList via Jikan API) for informational and discovery purposes only. We do not host, store, or distribute copyrighted anime episodes, movies, or video content.
        </Text>

        <Text style={styles.sectionTitle}>Filing a DMCA Takedown Notice</Text>
        <Text style={styles.body}>
          If you believe that content available on or through the Service infringes your copyright, please submit a DMCA takedown notice containing the following information:{'\n'}
          {'\n'}{'\u2022'} A physical or electronic signature of the copyright owner or authorized agent{'\n'}
          {'\u2022'} Identification of the copyrighted work claimed to have been infringed{'\n'}
          {'\u2022'} Identification of the material that is claimed to be infringing, with sufficient detail to locate it within the Service{'\n'}
          {'\u2022'} Your contact information (name, address, telephone number, email){'\n'}
          {'\u2022'} A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law{'\n'}
          {'\u2022'} A statement, under penalty of perjury, that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner
        </Text>

        <Text style={styles.sectionTitle}>DMCA Designated Agent</Text>
        <Text style={styles.body}>
          Please send DMCA takedown notices to our designated agent at:{'\n'}
          {'\n'}Email: dmca@animeworld.com{'\n'}
          Subject Line: DMCA Takedown Notice{'\n'}
          {'\n'}Anime World - Copyright Department{'\n'}
          United States
        </Text>

        <Text style={styles.sectionTitle}>Counter-Notification</Text>
        <Text style={styles.body}>
          If you believe that your content was removed or disabled in error, you may file a counter-notification containing:{'\n'}
          {'\n'}{'\u2022'} Your physical or electronic signature{'\n'}
          {'\u2022'} Identification of the material that was removed and the location where it appeared before removal{'\n'}
          {'\u2022'} A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification{'\n'}
          {'\u2022'} Your name, address, and telephone number{'\n'}
          {'\u2022'} A statement that you consent to the jurisdiction of the federal district court for the judicial district in which your address is located{'\n'}
          {'\u2022'} A statement that you will accept service of process from the person who provided the original DMCA notification
        </Text>

        <Text style={styles.sectionTitle}>Repeat Infringers</Text>
        <Text style={styles.body}>
          In accordance with the DMCA and other applicable laws, we have adopted a policy of terminating, in appropriate circumstances, the accounts of users who are deemed to be repeat infringers. We may also limit access to the Service or terminate the accounts of any users who infringe the intellectual property rights of others, whether or not there is any repeat infringement.
        </Text>

        <Text style={styles.sectionTitle}>Good Faith Reporting</Text>
        <Text style={styles.body}>
          Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing may be subject to liability for damages. Please also be aware that the information provided in a DMCA notice may be forwarded to the person who provided the allegedly infringing content.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>
          For copyright-related inquiries, please contact us at dmca@animeworld.com.{'\n'}
          For general inquiries, please contact us at contact@animeworld.com.
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
