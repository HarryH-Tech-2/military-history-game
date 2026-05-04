import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../tokens';

export function Chip({ label, tone = 'bronze' }: { label: string; tone?: 'bronze' | 'parchment' }) {
  const bg = tone === 'bronze' ? colors.bronze : colors.parchment;
  const fg = colors.ink;
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
