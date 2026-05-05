import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../design/components/Button';
import { PasswordInput } from '../../design/components/PasswordInput';
import { radii, spacing, type } from '../../design/tokens';
import { useColors } from '../../design/useColors';
import { emailSignIn, emailSignUp } from './useEmailAuth';
import { mapAuthError } from './authErrors';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).optional(),
});
type FormValues = z.infer<typeof schema>;

export function EmailAuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const colors = useColors();
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setBusy(true); setError(null);
    try {
      if (mode === 'signup') await emailSignUp(values.email, values.password, values.displayName ?? values.email.split('@')[0]);
      else await emailSignIn(values.email, values.password);
    } catch (e) {
      setError(mapAuthError(e));
    } finally { setBusy(false); }
  };

  // Match PasswordInput exactly (same backgroundColor, color, borderColor)
  // so all auth fields look like a single, unified set.
  const inputStyle = {
    backgroundColor: colors.inkSoft,
    color: colors.parchment,
    borderColor: colors.bronzeDeep,
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {mode === 'signup' && (
        <Controller
          control={control} name="displayName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="Display name"
              placeholderTextColor={colors.parchmentDim}
              value={value ?? ''} onChangeText={onChange}
            />
          )}
        />
      )}
      <Controller
        control={control} name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, inputStyle]}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.parchmentDim}
            value={value ?? ''} onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control} name="password"
        render={({ field: { onChange, value } }) => (
          <PasswordInput placeholder="Password" value={value ?? ''} onChangeText={onChange} />
        )}
      />
      {(errors.email || errors.password) && (
        <Text style={[type.caption, { color: colors.defeat }]}>Check your email & password.</Text>
      )}
      {error && <Text style={[type.caption, { color: colors.defeat }]}>{error}</Text>}
      <Button label={mode === 'signup' ? 'Create account' : 'Sign in'} onPress={handleSubmit(onSubmit)} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    fontSize: 16,
  },
});
