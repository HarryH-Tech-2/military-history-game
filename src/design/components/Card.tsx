import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { radii, shadow, spacing } from '../tokens';
import { useColors } from '../useColors';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.inkSoft }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
});
