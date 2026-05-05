import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { colors, spacing, type } from '../../design/tokens';
import { signInWithApple } from './useAppleAuth';
import { signInWithCredentialManager } from './useCredentialManager';
import { EmailAuthForm } from './EmailAuthForm';

export function SignInScreen() {
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    try { await signInWithCredentialManager(); }
    catch (e: any) { if (e.code !== 'CM_ERROR') setError(e.message); }
  };
  const handleApple = async () => {
    try { await signInWithApple(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={[type.display, styles.title]}>Sign in to play</Text>
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
        <Button label={showEmail ? 'Hide email form' : 'or use email'} variant="ghost" onPress={() => setShowEmail(v => !v)} />
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
        {error && <Text style={[type.caption, { color: colors.defeat }]}>{error}</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', gap: spacing.md },
  title: { color: colors.parchment, textAlign: 'center', marginBottom: spacing.lg },
});
