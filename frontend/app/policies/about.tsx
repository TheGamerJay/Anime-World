import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function AboutUsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.logo}>ANIME<Text style={styles.logoPink}>WORLD</Text></Text>
          <Text style={styles.tagline}>Where Original Anime Lives</Text>
        </View>

        <Text style={styles.sectionTitle}>🎯 Our Mission</Text>
        <Text style={styles.paragraph}>
          AnimeWorld is a platform built for creators, by anime lovers. We believe that the next great anime stories should come from passionate independent creators around the world, not just big studios.
        </Text>
        <Text style={styles.paragraph}>
          Our mission is to empower anime creators to share their original stories, build audiences, and earn a living doing what they love.
        </Text>

        <Text style={styles.sectionTitle}>🌟 What Makes Us Different</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.brand.cyan + '20' }]}>
              <Ionicons name="create" size={24} color={Colors.brand.cyan} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Original Content Only</Text>
              <Text style={styles.featureDesc}>No pirated anime - only original creations from independent artists</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.brand.pink + '20' }]}>
              <Ionicons name="cash" size={24} color={Colors.brand.pink} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Creator-First Monetization</Text>
              <Text style={styles.featureDesc}>Creators keep 80% of all earnings from tips and subscriptions</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.brand.success + '20' }]}>
              <Ionicons name="people" size={24} color={Colors.brand.success} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Community Driven</Text>
              <Text style={styles.featureDesc}>Built around supporting and discovering new talent</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.brand.warning + '20' }]}>
              <Ionicons name="globe" size={24} color={Colors.brand.warning} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Global Platform</Text>
              <Text style={styles.featureDesc}>Creators and fans from around the world</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📚 Content Types</Text>
        <Text style={styles.paragraph}>
          📺 <Text style={styles.bold}>Series</Text> - Multi-episode animated content{"\n"}
          📖 <Text style={styles.bold}>Novels</Text> - Written stories and light novels{"\n"}
          🎬 <Text style={styles.bold}>Movies</Text> - Feature-length films
        </Text>

        <Text style={styles.sectionTitle}>🚀 Our Story</Text>
        <Text style={styles.paragraph}>
          AnimeWorld was founded in 2025 with a simple idea: what if there was a YouTube specifically for original anime content?
        </Text>
        <Text style={styles.paragraph}>
          We saw talented artists creating amazing work but struggling to find an audience and make a living. Traditional platforms either didn't understand anime culture or took too much in fees.
        </Text>
        <Text style={styles.paragraph}>
          So we built AnimeWorld - a home for original anime where creators can thrive and fans can discover the next generation of anime storytelling.
        </Text>

        <Text style={styles.sectionTitle}>🤝 Join Us</Text>
        <Text style={styles.paragraph}>
          Whether you're a creator with stories to tell or a fan looking for fresh content, AnimeWorld is your home. Welcome to the future of anime. 🌸
        </Text>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Follow Us</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-twitter" size={24} color={Colors.brand.cyan} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-instagram" size={24} color={Colors.brand.pink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-discord" size={24} color="#5865F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>

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
  heroSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.brand.cyan, letterSpacing: 2 },
  logoPink: { color: Colors.brand.pink },
  tagline: { color: Colors.text.muted, fontSize: 14, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  paragraph: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing.sm },
  bold: { fontWeight: '700', color: Colors.text.primary },
  featureList: { gap: 16, marginTop: Spacing.sm },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, marginBottom: 2 },
  featureDesc: { fontSize: 13, color: Colors.text.muted, lineHeight: 18 },
  socialSection: { marginTop: Spacing.xl, alignItems: 'center' },
  socialTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.muted, marginBottom: Spacing.md },
  socialLinks: { flexDirection: 'row', gap: 16 },
  socialBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bg.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
});
