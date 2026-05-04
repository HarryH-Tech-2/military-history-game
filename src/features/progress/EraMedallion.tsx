import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Era } from '../../data/eras';
import { colors, radii, spacing, type } from '../../design/tokens';

export type EraStatus = 'locked' | 'current' | 'completed';

export function EraMedallion({
  era, status, score, onPress,
}: {
  era: Era;
  status: EraStatus;
  score?: { correct: number; points: number };
  onPress?: () => void;
}) {
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (status === 'current') {
      pulse.value = withRepeat(withTiming(1.06, { duration: 1100 }), -1, true);
    } else {
      pulse.value = 1;
    }
  }, [status, pulse]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const palette = {
    locked: { bg: colors.inkSoft, fg: colors.parchmentDim, ring: '#3A4358' },
    current: { bg: colors.bronze, fg: colors.ink, ring: colors.bronze },
    completed: { bg: colors.inkSoft, fg: colors.parchment, ring: colors.bronze },
  }[status];

  return (
    <Pressable onPress={onPress} disabled={status === 'locked'} style={styles.container}>
      <Animated.View style={[styles.disc, { backgroundColor: palette.bg, borderColor: palette.ring }, animStyle]}>
        <Text style={[type.bodyBold, { color: palette.fg, textAlign: 'center' }]}>
          {era.label}
        </Text>
        {status === 'completed' && score && (
          <Text style={[type.caption, { color: colors.bronze }]}>{score.correct}/10 · {score.points} pts</Text>
        )}
        {status === 'locked' && (
          <Text style={[type.caption, { color: palette.fg }]}>Locked</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.md },
  disc: {
    width: 220, height: 220,
    borderRadius: radii.pill,
    borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: 4,
  },
});
