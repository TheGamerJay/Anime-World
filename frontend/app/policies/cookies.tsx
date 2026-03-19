import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme';

export default function CookiePolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="cookies-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cookie Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: March 18, 2026</Text>

        <Text style={styles.sectionTitle}>What Are Cookies?</Text>
        <Text style={styles.body}>
          Cookies are small text files that are stored on your device when you visit a website or use an application. They are widely used to make websites and applications work more efficiently, provide a better user experience, and provide information to the owners of the site or app.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Cookies</Text>
        <Text style={styles.body}>
          Anime World uses cookies and similar technologies for the following purposes:
        </Text>
        <Text style={styles.subTitle}>Essential Cookies</Text>
        <Text style={styles.body}>
          These cookies are necessary for the Service to function properly. They enable core functionality such as user authentication, security, and session management. Without these cookies, the Service cannot function correctly. You cannot opt out of essential cookies.
        </Text>
        <Text style={styles.subTitle}>Performance and Analytics Cookies</Text>
        <Text style={styles.body}>
          These cookies help us understand how users interact with our Service by collecting and reporting information anonymously. This data helps us improve the performance and usability of our Service.
        </Text>
        <Text style={styles.subTitle}>Functionality Cookies</Text>
        <Text style={styles.body}>
          These cookies allow the Service to remember choices you make (such as your username, language, or region) and provide enhanced, personalized features. They may also be used to provide services you have asked for, such as watching a video or commenting on a blog.
        </Text>
        <Text style={styles.subTitle}>Advertising Cookies</Text>
        <Text style={styles.body}>
          These cookies are used to deliver advertisements that are relevant to you and your interests. They are also used to limit the number of times you see an advertisement and to help measure the effectiveness of advertising campaigns. They are placed by advertising networks with our permission, including Google AdSense.
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Cookies</Text>
        <Text style={styles.body}>
          In addition to our own cookies, we may also use various third-party cookies to report usage statistics, deliver advertisements, and so on. These may include:{'\n'}
          {'\n'}{'\u2022'} Google AdSense / Google Ads - for personalized advertising{'\n'}
          {'\u2022'} Google Analytics - for usage analytics and reporting{'\n'}
          {'\u2022'} DoubleClick (by Google) - for ad serving and tracking{'\n'}
          {'\n'}These third-party services have their own privacy policies addressing how they use such information.
        </Text>

        <Text style={styles.sectionTitle}>Google AdSense and DoubleClick Cookie</Text>
        <Text style={styles.body}>
          Google, as a third-party vendor, uses cookies (including the DoubleClick cookie) to serve ads based on your prior visits to our Service and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our Service and/or other sites on the Internet.
        </Text>
        <Text style={styles.body}>
          You may opt out of personalized advertising by visiting Google's Ads Settings at https://adssettings.google.com. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting https://www.aboutads.info/choices.
        </Text>

        <Text style={styles.sectionTitle}>Managing Cookies</Text>
        <Text style={styles.body}>
          You can control and manage cookies in various ways. Please note that removing or blocking cookies can impact your user experience.{'\n'}
          {'\n'}{'\u2022'} Browser Settings: Most browsers allow you to view, manage, delete, and block cookies. Be aware that if you delete all cookies, your preferences and settings will be lost{'\n'}
          {'\u2022'} Device Settings: Your mobile device may provide settings to manage cookies and tracking technologies{'\n'}
          {'\u2022'} Opt-Out Tools: You can use opt-out tools provided by advertising industry bodies such as the Network Advertising Initiative (https://optout.networkadvertising.org) or the Digital Advertising Alliance (https://optout.aboutads.info)
        </Text>

        <Text style={styles.sectionTitle}>Do Not Track Signals</Text>
        <Text style={styles.body}>
          Some browsers incorporate a Do Not Track (DNT) feature that signals to websites that you do not want to be tracked. Because there is not yet a common understanding of how to interpret the DNT signal, our Service does not currently respond to browser DNT signals. However, you can use the range of other tools provided to control data collection and use.
        </Text>

        <Text style={styles.sectionTitle}>Updates to This Cookie Policy</Text>
        <Text style={styles.body}>
          We may update this Cookie Policy from time to time to reflect changes in the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this policy regularly to stay informed about our use of cookies.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about our use of cookies, please contact us at contact@animeworld.com.
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
