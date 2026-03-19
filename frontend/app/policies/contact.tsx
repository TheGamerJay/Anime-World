import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function ContactScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    Alert.alert('Message Sent', 'Thank you for contacting us! We will respond within 24-48 hours.');
    setName(''); setEmail(''); setSubject(''); setMessage('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="contact-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.body}>
            We'd love to hear from you. Whether you have a question about our features, need help with your account, want to report an issue, or have a suggestion, our team is ready to help.
          </Text>

          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={20} color={Colors.brand.cyan} />
              <Text style={styles.contactText}>contact@animeworld.com</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="time-outline" size={20} color={Colors.brand.cyan} />
              <Text style={styles.contactText}>Response time: 24-48 hours</Text>
            </View>
          </View>

          <Text style={styles.formTitle}>Send Us a Message</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NAME *</Text>
            <TextInput testID="contact-name-input" style={styles.input} placeholder="Your name" placeholderTextColor={Colors.text.muted} value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL *</Text>
            <TextInput testID="contact-email-input" style={styles.input} placeholder="your@email.com" placeholderTextColor={Colors.text.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SUBJECT</Text>
            <TextInput testID="contact-subject-input" style={styles.input} placeholder="What is this about?" placeholderTextColor={Colors.text.muted} value={subject} onChangeText={setSubject} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MESSAGE *</Text>
            <TextInput testID="contact-message-input" style={[styles.input, styles.textArea]} placeholder="Tell us more..." placeholderTextColor={Colors.text.muted} value={message} onChangeText={setMessage} multiline numberOfLines={5} textAlignVertical="top" />
          </View>

          <TouchableOpacity testID="contact-submit-btn" onPress={handleSubmit} style={styles.submitBtn}>
            <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
              <Text style={styles.submitText}>Send Message</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  sectionTitle: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  body: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing.md },
  contactInfo: { backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md, gap: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactText: { fontSize: 14, color: Colors.text.primary, fontWeight: '500' },
  formTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.md },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.muted, letterSpacing: 1.5, marginBottom: 6 },
  input: { backgroundColor: Colors.bg.card, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 48, color: Colors.text.primary, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  textArea: { height: 120, paddingTop: 14 },
  submitBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: Spacing.sm },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
