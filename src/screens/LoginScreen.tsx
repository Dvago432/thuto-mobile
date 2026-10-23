import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { LoginResult } from '../api/auth';

interface LoginScreenProps {
  onLogin: (eid: string, pw: string) => Promise<LoginResult>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [eid, setEid] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    const trimmedEid = eid.trim();
    if (!trimmedEid) {
      setError('Please enter your student ID.');
      return;
    }
    if (!pw) {
      setError('Please enter your password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await onLogin(trimmedEid, pw);
      if (!result.success) {
        setError(result.error ?? 'Login failed. Check student ID or password.');
      }
    } finally {
      setLoading(false);
    }
  }, [eid, pw, onLogin]);

  const handleFillDemo = () => {
    setEid('202304918');
    setPw('demo1234');
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* NUL Branding Lockup */}
        <View style={styles.logoContainer}>
          <View style={styles.crestCircle}>
            <View style={styles.thebeShield}>
              <Text style={styles.thebeCross}>✝</Text>
            </View>
          </View>

          <Text style={styles.universityName}>NATIONAL UNIVERSITY OF LESOTHO</Text>
          <Text style={styles.appName}>Thuto Mobile</Text>
          <Text style={styles.mottoText}>"Nete ke Thebe"</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Sign In</Text>
          <Text style={styles.cardSub}>Direct connection to Roma campus gateway</Text>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Student ID */}
          <Text style={styles.label}>Student ID / EID</Text>
          <TextInput
            style={styles.input}
            value={eid}
            onChangeText={(v) => { setEid(v); setError(null); }}
            placeholder="e.g. 202304918"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="next"
            editable={!loading}
          />

          {/* Password */}
          <Text style={styles.label}>Portal Password</Text>
          <View style={styles.pwRow}>
            <TextInput
              style={[styles.input, styles.pwInput]}
              value={pw}
              onChangeText={(v) => { setPw(v); setError(null); }}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPw((s) => !s)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnLoading]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#020617" size="small" />
            ) : (
              <Text style={styles.btnText}>Sign in to Thuto</Text>
            )}
          </TouchableOpacity>

          {/* Demo Account Quick-Fill */}
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={handleFillDemo}
            disabled={loading}
          >
            <Text style={styles.demoBtnText}>Try Demo Student (202304918)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Hosted on-premise at Roma Campus · Direct Sakai REST Client
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617', // Midnight Slate/Navy
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  // NUL Emblem & Branding
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  crestCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0B192C',
    borderWidth: 2.5,
    borderColor: '#F59E0B', // Golden Amber
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  thebeShield: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1E3E62',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thebeCross: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: '900',
  },
  universityName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mottoText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Card
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 20,
  },
  // Error Banner
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    borderLeftWidth: 3.5,
    borderLeftColor: '#EF4444',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
    lineHeight: 16,
  },
  // Form Inputs
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#F8FAFC',
    marginBottom: 14,
    backgroundColor: '#020617',
  },
  pwRow: {
    position: 'relative',
    marginBottom: 20,
  },
  pwInput: {
    marginBottom: 0,
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  eyeIcon: {
    fontSize: 16,
  },
  // Button
  btn: {
    backgroundColor: '#F59E0B', // Golden amber
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnLoading: {
    backgroundColor: '#D97706',
  },
  btnText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  demoBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  demoBtnText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 24,
    textAlign: 'center',
  },
});
