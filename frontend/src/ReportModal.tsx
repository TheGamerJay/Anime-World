import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from './theme';
import { reportAPI } from './api';
import { useAuth } from './AuthContext';

const REPORT_REASONS = [
  { id: 'copyright', label: '©️ Copyright Infringement', description: 'Stolen or unauthorized content' },
  { id: 'inappropriate', label: '🔞 Inappropriate Content', description: 'Adult, violent, or offensive' },
  { id: 'spam', label: '🚫 Spam', description: 'Repetitive or misleading content' },
  { id: 'harassment', label: '😤 Harassment', description: 'Bullying or targeting users' },
  { id: 'other', label: '❓ Other', description: 'Something else' },
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: 'series' | 'episode' | 'user';
  contentId: string;
  contentTitle: string;
}

export default function ReportModal({ visible, onClose, contentType, contentId, contentTitle }: ReportModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Oops! 🙈', 'Please select a reason for your report');
      return;
    }

    setLoading(true);
    try {
      await reportAPI.create({
        content_type: contentType,
        content_id: contentId,
        reason: selectedReason,
        details: details.trim(),
      });
      Alert.alert(
        'Report Submitted 📝',
        'Thank you for helping keep our community safe. Our team will review this report.',
        [{ text: 'OK', onPress: onClose }]
      );
      setSelectedReason('');
      setDetails('');
    } catch (err: any) {
      Alert.alert('Oops! 🙈', err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'series': return 'content';
      case 'episode': return 'episode/chapter';
      case 'user': return 'user';
      default: return 'content';
    }
  };

  if (!user) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>🚨 Report Content</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.signInPrompt}>
              <Text style={styles.signInEmoji}>🙈</Text>
              <Text style={styles.signInText}>Please sign in to report content</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>🚨 Report {getContentTypeLabel()}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.contentLabel}>Reporting: <Text style={styles.contentTitle}>{contentTitle}</Text></Text>

          <Text style={styles.sectionLabel}>What's wrong with this {getContentTypeLabel()}?</Text>
          
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              onPress={() => setSelectedReason(reason.id)}
              style={[styles.reasonItem, selectedReason === reason.id && styles.reasonItemActive]}
            >
              <View style={styles.reasonLeft}>
                <Text style={styles.reasonLabel}>{reason.label}</Text>
                <Text style={styles.reasonDesc}>{reason.description}</Text>
              </View>
              <View style={[styles.radio, selectedReason === reason.id && styles.radioActive]}>
                {selectedReason === reason.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionLabel}>Additional Details (optional)</Text>
          <TextInput
            style={styles.detailsInput}
            placeholder="Provide more context about your report..."
            placeholderTextColor={Colors.text.muted}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.submitBtn}>
            <LinearGradient colors={[Colors.brand.error, '#FF6B6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="flag" size={18} color="#fff" />
                  <Text style={styles.submitText}>Submit Report</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            ⚠️ False reports may result in account restrictions. Only submit genuine concerns.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.bg.default, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    padding: Spacing.md, maxHeight: '90%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  contentLabel: { fontSize: 13, color: Colors.text.muted, marginBottom: Spacing.md },
  contentTitle: { color: Colors.text.primary, fontWeight: '600' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: Spacing.sm },
  reasonItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.sm, marginBottom: 8, backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
  },
  reasonItemActive: { borderColor: Colors.brand.error, backgroundColor: Colors.brand.error + '10' },
  reasonLeft: { flex: 1 },
  reasonLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  reasonDesc: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: Colors.brand.error },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.brand.error },
  detailsInput: {
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, color: Colors.text.primary,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: Spacing.md,
  },
  submitBtn: { borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disclaimer: { fontSize: 11, color: Colors.text.muted, textAlign: 'center', lineHeight: 16 },
  signInPrompt: { alignItems: 'center', paddingVertical: 40 },
  signInEmoji: { fontSize: 48, marginBottom: 12 },
  signInText: { color: Colors.text.muted, fontSize: 14 },
});
