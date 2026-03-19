import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';

const CONTACT_REASONS = [
  { id: 'general', label: '💬 General Inquiry', icon: 'chatbubble-outline' },
  { id: 'support', label: '🆘 Technical Support', icon: 'help-circle-outline' },
  { id: 'creator', label: '🎨 Creator Help', icon: 'create-outline' },
  { id: 'payment', label: '💳 Payment Issues', icon: 'card-outline' },
  { id: 'report', label: '🚨 Report Issue', icon: 'flag-outline' },
  { id: 'partnership', label: '🤝 Partnership', icon: 'people-outline' },
];

export default function ContactUsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Oops! 🙈', 'Please select a contact reason');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter your email');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter a subject');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter your message');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Message Sent! 📨',
        'Thank you for contacting us. We\'ll get back to you within 24-48 hours.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Have a question, feedback, or need help? We're here for you! 🙌
        </Text>

        {/* Contact Reason */}
        <Text style={styles.label}>What can we help you with? *</Text>
        <View style={styles.reasonGrid}>
          {CONTACT_REASONS.map((r) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setReason(r.id)}
              style={[styles.reasonCard, reason === r.id && styles.reasonCardActive]}
            >
              <Ionicons
                name={r.icon as any}
                size={24}
                color={reason === r.id ? Colors.brand.cyan : Colors.text.muted}
              />
              <Text style={[styles.reasonLabel, reason === r.id && styles.reasonLabelActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Email */}
        <Text style={styles.label}>Your Email *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={Colors.text.muted} />
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={Colors.text.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Subject */}
        <Text style={styles.label}>Subject *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="text-outline" size={20} color={Colors.text.muted} />
          <TextInput
            style={styles.input}
            placeholder="Brief description of your inquiry"
            placeholderTextColor={Colors.text.muted}
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
          />
        </View>

        {/* Message */}
        <Text style={styles.label}>Message *</Text>
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us more about your inquiry..."
            placeholderTextColor={Colors.text.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            maxLength={2000}
          />
        </View>
        <Text style={styles.charCount}>{message.length}/2000</Text>

        {/* Submit */}
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.submitBtn}>
          <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#000" />
                <Text style={styles.submitText}>Send Message</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Direct Contact */}
        <View style={styles.directSection}>
          <Text style={styles.directTitle}>Or reach us directly</Text>
          
          <View style={styles.directItem}>
            <Ionicons name="mail" size={20} color={Colors.brand.cyan} />
            <Text style={styles.directText}>support@animeworld.app</Text>
          </View>
          
          <View style={styles.directItem}>
            <Ionicons name="logo-discord" size={20} color="#5865F2" />
            <Text style={styles.directText}>discord.gg/animeworld</Text>
          </View>
          
          <View style={styles.directItem}>
            <Ionicons name="logo-twitter" size={20} color={Colors.brand.cyan} />
            <Text style={styles.directText}>@AnimeWorldApp</Text>
          </View>
        </View>

        <Text style={styles.responseTime}>
          ⏰ Average response time: 24-48 hours
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
  intro: { fontSize: 15, color: Colors.text.secondary, marginBottom: Spacing.lg, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8, marginTop: Spacing.md },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reasonCard: {
    width: '48%', backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  reasonCardActive: { borderColor: Colors.brand.cyan, backgroundColor: Colors.brand.cyanDim },
  reasonLabel: { fontSize: 12, color: Colors.text.muted, textAlign: 'center' },
  reasonLabelActive: { color: Colors.brand.cyan, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.border,
  },
  textAreaContainer: { alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: Colors.text.primary, marginLeft: 10 },
  textArea: { minHeight: 120, textAlignVertical: 'top', marginLeft: 0 },
  charCount: { fontSize: 11, color: Colors.text.muted, textAlign: 'right', marginTop: 4 },
  submitBtn: { marginTop: Spacing.lg, borderRadius: Radius.full, overflow: 'hidden' },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitText: { color: '#000', fontWeight: '700', fontSize: 16 },
  directSection: {
    marginTop: Spacing.xl, backgroundColor: Colors.bg.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  directTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.muted, marginBottom: Spacing.md },
  directItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  directText: { fontSize: 14, color: Colors.text.primary },
  responseTime: { fontSize: 12, color: Colors.text.muted, textAlign: 'center', marginTop: Spacing.lg },
});
