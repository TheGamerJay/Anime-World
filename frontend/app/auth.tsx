import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/theme';
import { useAuth } from '../src/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AuthScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async () => {
    if (mode === 'forgot') {
      handleForgotPassword();
      return;
    }

    if (mode === 'register') {
      if (!username.trim()) {
        Alert.alert('Oops! 🙈', 'Please enter a username');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Oops! 🙈', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Oops! 🙈', 'Password must be at least 6 characters');
        return;
      }
    }
    if (!email.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Oops! 🙈', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Oops! 🙈', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Oops! 🙈', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password?email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });
      const data = await res.json();
      setResetSent(true);
      Alert.alert(
        'Check Your Email 📧',
        'If an account exists with this email, you will receive a password reset link.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    } catch (err: any) {
      Alert.alert('Oops! 🙈', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEmoji = () => {
    if (mode === 'login') return '🙊';
    if (mode === 'register') return '🙉';
    return '🙈';
  };

  const getTitle = () => {
    if (mode === 'login') return 'Welcome Back!';
    if (mode === 'register') return 'Join the Community!';
    return 'Reset Password';
  };

  const getSubtitle = () => {
    if (mode === 'login') return 'Sign in to continue your anime journey';
    if (mode === 'register') return 'Create an account to get started';
    return 'Enter your email to receive a reset link';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => mode === 'forgot' ? setMode('login') : router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Logo with Monkey Emoji */}
          <View style={styles.logoSection}>
            <Text style={styles.monkeyEmoji}>{getEmoji()}</Text>
            <Text style={styles.logo}>ANIME<Text style={styles.logoPink}>WORLD</Text></Text>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </View>

          {/* Mode Toggle (only for login/register) */}
          {mode !== 'forgot' && (
            <View style={styles.modeToggle}>
              <TouchableOpacity
                onPress={() => setMode('login')}
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
              >
                <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>🙊 Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('register')}
                style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
              >
                <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>🙉 Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputEmoji}>🐵</Text>
                  <TextInput
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
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputEmoji}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.text.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {mode !== 'forgot' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputEmoji}>🔒</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.text.muted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Text style={styles.eyeEmoji}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {mode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputEmoji}>🔐</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor={Colors.text.muted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                      />
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Forgot Password Link (only on login) */}
            {mode === 'login' && (
              <TouchableOpacity onPress={() => setMode('forgot')} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>🙈 Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.submitBtn}>
              <LinearGradient colors={[Colors.brand.cyan, Colors.brand.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'login' ? '🙊 Sign In' : mode === 'register' ? '🙉 Create Account' : '📧 Send Reset Link'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            {mode !== 'forgot' && (
              <Text style={styles.footerText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={styles.footerLink}>
                  {mode === 'login' ? '🙉 Create one' : '🙊 Sign in'}
                </Text>
              </Text>
            )}

            {mode === 'forgot' && (
              <TouchableOpacity onPress={() => setMode('login')} style={styles.backToLoginBtn}>
                <Ionicons name="arrow-back" size={16} color={Colors.brand.cyan} />
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Fun Facts */}
          <View style={styles.funFact}>
            <Text style={styles.funFactEmoji}>🍌</Text>
            <Text style={styles.funFactText}>
              {mode === 'login' 
                ? 'Tip: Monkeys see no evil when you enter your password!'
                : mode === 'register'
                ? 'Fun fact: Join 1000+ anime creators sharing their passion!'
                : 'We\'ll help you get back to your anime in no time!'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  scrollContent: { flexGrow: 1, padding: Spacing.md },
  header: { marginBottom: Spacing.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  logoSection: { alignItems: 'center', marginBottom: Spacing.lg },
  monkeyEmoji: { fontSize: 64, marginBottom: 8 },
  logo: { fontSize: 32, fontWeight: '800', color: Colors.brand.cyan, letterSpacing: 2 },
  logoPink: { color: Colors.brand.pink },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.sm },
  subtitle: { color: Colors.text.muted, fontSize: 14, marginTop: 4, textAlign: 'center' },
  modeToggle: {
    flexDirection: 'row', backgroundColor: Colors.bg.surface, borderRadius: Radius.md,
    padding: 4, marginBottom: Spacing.lg,
  },
  modeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.sm },
  modeBtnActive: { backgroundColor: Colors.bg.card },
  modeBtnText: { color: Colors.text.muted, fontWeight: '600', fontSize: 14 },
  modeBtnTextActive: { color: Colors.text.primary },
  form: { flex: 1 },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.border,
  },
  inputEmoji: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: Colors.text.primary },
  eyeBtn: { padding: 4 },
  eyeEmoji: { fontSize: 18 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -8 },
  forgotText: { color: Colors.brand.pink, fontSize: 13, fontWeight: '600' },
  submitBtn: { marginTop: Spacing.sm, borderRadius: Radius.full, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#000', fontWeight: '700', fontSize: 16 },
  footerText: { textAlign: 'center', marginTop: Spacing.lg, color: Colors.text.muted, fontSize: 14 },
  footerLink: { color: Colors.brand.cyan, fontWeight: '600' },
  backToLoginBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 6, marginTop: Spacing.lg 
  },
  backToLoginText: { color: Colors.brand.cyan, fontSize: 14, fontWeight: '600' },
  funFact: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: Spacing.md,
    marginTop: Spacing.xl, gap: 8,
  },
  funFactEmoji: { fontSize: 20 },
  funFactText: { color: Colors.text.muted, fontSize: 12, flex: 1 },
});
