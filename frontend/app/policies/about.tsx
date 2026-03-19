import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="about-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>About Anime World</Text>
        <Text style={styles.body}>
          Anime World is a dedicated anime discovery and information platform designed for anime enthusiasts worldwide. Our mission is to provide fans with a seamless, beautiful, and intuitive way to discover, browse, and keep track of their favorite anime series and movies.
        </Text>

        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.body}>
          We believe every anime fan deserves a premium experience when exploring the vast world of anime. Anime World is built to be the go-to platform for discovering new series, tracking your watchlist, and staying up-to-date with the latest trending and upcoming anime titles.
        </Text>

        <Text style={styles.sectionTitle}>What We Offer</Text>
        <Text style={styles.body}>
          {'\u2022'} Comprehensive anime catalog with thousands of titles{'\n'}
          {'\u2022'} Real-time trending and seasonal anime updates{'\n'}
          {'\u2022'} Detailed anime information including synopses, genres, studios, and ratings{'\n'}
          {'\u2022'} Episode listings and tracking{'\n'}
          {'\u2022'} Personal watchlist management{'\n'}
          {'\u2022'} Advanced search and genre-based filtering{'\n'}
          {'\u2022'} Watch history tracking{'\n'}
          {'\u2022'} Beautiful, user-friendly mobile interface
        </Text>

        <Text style={styles.sectionTitle}>Our Data Sources</Text>
        <Text style={styles.body}>
          Anime World aggregates anime information from publicly available sources and APIs, including MyAnimeList via the Jikan API. All anime content, images, and metadata belong to their respective copyright holders and content creators.
        </Text>

        <Text style={styles.sectionTitle}>Our Commitment</Text>
        <Text style={styles.body}>
          We are committed to:{'\n'}
          {'\u2022'} Providing accurate and up-to-date anime information{'\n'}
          {'\u2022'} Protecting user privacy and data security{'\n'}
          {'\u2022'} Continuously improving the user experience{'\n'}
          {'\u2022'} Respecting intellectual property rights{'\n'}
          {'\u2022'} Building an inclusive community for all anime fans{'\n'}
          {'\u2022'} Maintaining transparency in our operations
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          We value feedback from our community. If you have questions, suggestions, or concerns, please reach out to us at contact@animeworld.com.
        </Text>

        <Text style={styles.body}>
          Thank you for being part of the Anime World community!
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  body: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing.sm },
});
