import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, type } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  label, onPress, variant = 'primary', loading, disabled, leftIcon,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}) {
  const handle = () => {
    if (disabled || loading) return;
    Haptics.selectionAsync();
    onPress();
  };
  const palette = variantStyles[variant];
  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        palette.container,
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      <View style={styles.row}>
        {leftIcon}
        {loading ? <ActivityIndicator color={palette.text.color} /> : (
          <Text style={[type.button, palette.text]}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const variantStyles = {
  primary: {
    container: { backgroundColor: colors.bronze },
    text: { color: colors.ink },
  },
  secondary: {
    container: { backgroundColor: colors.inkSoft, borderWidth: 1, borderColor: colors.bronzeDeep },
    text: { color: colors.parchment },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.parchment },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
