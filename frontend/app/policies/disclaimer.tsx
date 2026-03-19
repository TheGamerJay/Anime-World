import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function DisclaimerScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disclaimer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: June 2025</Text>

        <Text style={styles.sectionTitle}>⚠️ User-Generated Content Platform</Text>
        <Text style={styles.paragraph}>
          AnimeWorld is a platform for user-generated content. All series, novels, movies, and other content are created and uploaded by independent creators, not by AnimeWorld.
        </Text>

        <Text style={styles.sectionTitle}>📝 Content Disclaimer</Text>
        <Text style={styles.paragraph}>
          • All content is created by independent creators{"\n"}
          • AnimeWorld does not create, edit, or verify uploaded content{"\n"}
          • Views expressed in content are those of the creators, not AnimeWorld{"\n"}
          • We do not guarantee accuracy, quality, or appropriateness of content{"\n"}
          • Content may contain mature themes - view at your own discretion
        </Text>

        <Text style={styles.sectionTitle}>🚫 No Liability</Text>
        <Text style={styles.paragraph}>
          AnimeWorld shall not be held liable for:{"\n\n"}
          • Any content uploaded by users{"\n"}
          • Copyright infringement by users{"\n"}
          • Offensive or inappropriate content{"\n"}
          • Loss or damages from using the platform{"\n"}
          • Transactions between users and creators{"\n"}
          • Service interruptions or technical issues
        </Text>

        <Text style={styles.sectionTitle}>💰 Financial Transactions</Text>
        <Text style={styles.paragraph}>
          • All payments are processed by Stripe{"\n"}
          • We are not responsible for payment disputes{"\n"}
          • Tips and donations are at your own discretion{"\n"}
          • Refunds are handled on a case-by-case basis{"\n"}
          • Creator earnings are subject to platform fees (20%)
        </Text>

        <Text style={styles.sectionTitle}>🔞 Age Restriction</Text>
        <Text style={styles.paragraph}>
          Some content may contain mature themes. Users must be at least 13 years old to use the platform. Mature content may require age verification. Parental guidance is advised for minors.
        </Text>

        <Text style={styles.sectionTitle}>🔗 External Links</Text>
        <Text style={styles.paragraph}>
          Our platform may contain links to external sites. We are not responsible for the content or privacy practices of external websites. Access external links at your own risk.
        </Text>

        <Text style={styles.sectionTitle}>🛡️ "As Is" Service</Text>
        <Text style={styles.paragraph}>
          AnimeWorld is provided "as is" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
        </Text>

        <Text style={styles.sectionTitle}>🔄 Changes</Text>
        <Text style={styles.paragraph}>
          This disclaimer may be updated at any time. Continued use of the platform constitutes acceptance of any changes.
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
  paragraph: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
});
