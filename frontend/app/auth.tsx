import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth } from '../src/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isLogin && !username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(username.trim(), email.trim(), password);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Close button */}
          <TouchableOpacity testID="auth-close-btn" onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logo}>ANIME<Text style={styles.logoPink}>WORLD</Text></Text>
            <Text style={styles.subtitle}>{isLogin ? 'Welcome back!' : 'Create your account'}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={Colors.text.muted} />
                  <TextInput
                    testID="auth-username-input"
                    style={styles.input}
                    placeholder="Choose a username"
                    placeholderTextColor={Colors.text.muted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={Colors.text.muted} />
                <TextInput
                  testID="auth-email-input"
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.text.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.text.muted} />
                <TextInput
                  testID="auth-password-input"
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.monkeyEmoji}>{showPassword ? '\u{1F648}' : '\u{1F649}'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity testID="auth-submit-btn" onPress={handleSubmit} disabled={loading} style={styles.submitBtn}>
              <LinearGradient
                colors={[Colors.brand.cyan, Colors.brand.pink]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle */}
            <TouchableOpacity testID="auth-toggle-btn" onPress={() => setIsLogin(!isLogin)} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleTextHighlight}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg },
  closeBtn: { alignSelf: 'flex-end', padding: 8, marginTop: 8 },
  logoSection: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.brand.cyan, letterSpacing: 3 },
  logoPink: { color: Colors.brand.pink },
  subtitle: { fontSize: 16, color: Colors.text.secondary, marginTop: 8 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.muted, letterSpacing: 1.5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 52,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  input: { flex: 1, color: Colors.text.primary, fontSize: 16 },
  submitBtn: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  submitGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#000', fontWeight: '700', fontSize: 17 },
  toggleBtn: { alignItems: 'center', paddingVertical: 16 },
  toggleText: { fontSize: 14, color: Colors.text.secondary },
  toggleTextHighlight: { color: Colors.brand.cyan, fontWeight: '600' },
  monkeyEmoji: { fontSize: 22 },
});
