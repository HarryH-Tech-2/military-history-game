import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { radii, spacing, type } from '../tokens';
import { useColors } from '../useColors';
import { haptics } from '../../services/haptics';

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
  const colors = useColors();
  const handle = () => {
    if (disabled || loading) return;
    haptics.selection();
    onPress();
  };

  const palette = {
    primary: { bg: colors.bronze, fg: '#0E1B2C', borderColor: 'transparent' },
    secondary: { bg: colors.inkSoft, fg: colors.parchment, borderColor: colors.bronzeDeep },
    ghost: { bg: 'transparent', fg: colors.parchment, borderColor: 'transparent' },
  }[variant];

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.borderColor, borderWidth: variant === 'secondary' ? 1 : 0 },
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      <View style={styles.row}>
        {leftIcon}
        {loading ? <ActivityIndicator color={palette.fg} /> : (
          <Text style={[type.button, { color: palette.fg }]}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
