import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';

const RATINGS = [
  { id: 'all', badge: 'ALL', title: 'All Audiences', description: 'Only view content suitable for all ages.' },
  { id: 'pg', badge: 'PG', title: 'Parental Guidance', description: 'Mostly appropriate for children, may contain rude humor and/or comedic violence.' },
  { id: '12+', badge: '12+', title: 'Ages 12 and up', description: 'Content may include bloodless violence, light profanity, and/or coming-of-age themes.' },
  { id: '14+', badge: '14+', title: 'Ages 14 and up', description: 'May contain profanity, sexual topics and/or imagery, and other mature themes.' },
  { id: '16+', badge: '16+', title: 'Ages 16 and up', description: 'Content contains themes not appropriate for younger teens like graphic violence, profanity and/or sexuality.' },
  { id: '18+', badge: '18+', title: 'Ages 18 and up', description: 'Intended for adults, content may contain harsh profanity, explicit nudity/sexuality, and/or extreme violence.' },
];

export default function ContentRestrictionsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('18+');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="content-restrictions-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Restrictions</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Set the highest watchable content rating for your profile.</Text>

        {RATINGS.map((rating) => {
          const isSelected = selected === rating.id;
          return (
            <TouchableOpacity
              key={rating.id}
              testID={`rating-${rating.id}`}
              onPress={() => setSelected(rating.id)}
              style={styles.ratingItem}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <View style={styles.ratingInfo}>
                <View style={styles.ratingTitleRow}>
                  <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                    <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>{rating.badge}</Text>
                  </View>
                  <Text style={[styles.ratingTitle, isSelected && styles.ratingTitleSelected]}>{rating.title}</Text>
                </View>
                <Text style={styles.ratingDesc}>{rating.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.faqSection}>
          <Text style={styles.faqText}>
            Check out our <Text style={styles.faqLink}>Content Restrictions FAQ</Text> to learn more about content ratings.
          </Text>
        </View>

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
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  subtitle: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  ratingItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 16 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.text.muted, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  radioSelected: { borderColor: Colors.brand.cyan },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.brand.cyan },
  ratingInfo: { flex: 1 },
  ratingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border },
  badgeSelected: { backgroundColor: Colors.brand.cyanDim, borderColor: Colors.brand.cyan },
  badgeText: { fontSize: 12, fontWeight: '800', color: Colors.text.muted, letterSpacing: 0.5 },
  badgeTextSelected: { color: Colors.brand.cyan },
  ratingTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  ratingTitleSelected: { color: Colors.text.primary },
  ratingDesc: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20 },
  faqSection: { marginTop: Spacing.xl, alignItems: 'center', paddingHorizontal: Spacing.lg },
  faqText: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  faqLink: { color: Colors.brand.pink, fontWeight: '600' },
});
