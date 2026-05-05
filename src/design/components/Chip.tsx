import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radii, spacing, type } from '../tokens';
import { useColors } from '../useColors';

export function Chip({ label, tone = 'bronze' }: { label: string; tone?: 'bronze' | 'parchment' }) {
  const colors = useColors();
  // Chips read on top of imagery — keep a high-contrast warm pill in both themes.
  const bg = tone === 'bronze' ? colors.bronze : '#F2E8D5';
  const fg = '#0E1B2C';
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[type.bodyBold, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
});
