import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { colors, radii, spacing, type } from '../tokens';

export function Toast({ message, tone = 'error', onHide }: {
  message: string;
  tone?: 'error' | 'success';
  onHide: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onHide, 3500);
    return () => clearTimeout(t);
  }, [onHide]);
  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp}
      style={[styles.toast, { backgroundColor: tone === 'error' ? colors.defeat : colors.victory }]}>
      <Text style={[type.bodyBold, { color: colors.ink }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 60, left: spacing.lg, right: spacing.lg,
    padding: spacing.md, borderRadius: radii.md, alignItems: 'center',
  },
});
