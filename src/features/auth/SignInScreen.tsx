import React, { useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Button } from '../../design/components/Button';
import { spacing, type } from '../../design/tokens';
import { useColors } from '../../design/useColors';
import { signInWithApple } from './useAppleAuth';
import { signInWithCredentialManager } from './useCredentialManager';
import { EmailAuthForm } from './EmailAuthForm';
import { mapAuthError } from './authErrors';

const BG = require('../../../assets/auth-bg.webp');

export function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    try { await signInWithCredentialManager(); }
    catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'CM_ERROR') return;
      setError(mapAuthError(e));
    }
  };
  const handleApple = async () => {
    try { await signInWithApple(); }
    catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      setError(mapAuthError(e));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ink }]}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover">
        <LinearGradient
          colors={['rgba(14,27,44,0.55)', 'rgba(14,27,44,0.75)', 'rgba(14,27,44,0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[type.display, styles.title, { color: colors.parchment }]}>Sign in to play</Text>
          {Platform.OS === 'android' && (
            <Button label="Sign in with Google" onPress={handleGoogle} />
          )}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={20}
              style={{ height: 52 }}
              onPress={handleApple}
            />
          )}
          <Button
            label={showEmail ? 'Hide email form' : 'or use email'}
            variant="ghost"
            onPress={() => setShowEmail(v => !v)}
          />
          {showEmail && (
            <View style={{ gap: spacing.sm }}>
              <EmailAuthForm mode={mode} />
              <Button
                label={mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
                variant="ghost"
                onPress={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
              />
            </View>
          )}
          {error && <Text style={[type.caption, { color: colors.defeat, textAlign: 'center' }]}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: { textAlign: 'center', marginBottom: spacing.lg },
});
