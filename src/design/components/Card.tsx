import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, shadow, spacing } from '../tokens';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.inkSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
});
