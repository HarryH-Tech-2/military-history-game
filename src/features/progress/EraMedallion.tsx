import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
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
    locked:    { bg: colors.inkSoft, fg: colors.parchmentDim, ring: '#3A4358' },
    current:   { bg: colors.bronze,  fg: colors.ink,          ring: colors.bronze },
    completed: { bg: colors.inkSoft, fg: colors.parchment,    ring: colors.bronze },
  }[status];

  return (
    <Pressable onPress={onPress} disabled={status === 'locked'} style={styles.row}>
      <Animated.View style={[styles.disc, { backgroundColor: palette.bg, borderColor: palette.ring }, animStyle]}>
        {status === 'locked' ? (
          <Ionicons name="lock-closed" size={20} color={palette.fg} />
        ) : status === 'completed' ? (
          <Ionicons name="checkmark" size={22} color={palette.fg} />
        ) : (
          <Ionicons name="flag" size={20} color={palette.fg} />
        )}
      </Animated.View>
      <View style={styles.meta}>
        <Text style={[type.bodyBold, { color: status === 'locked' ? colors.parchmentDim : colors.parchment }]} numberOfLines={1}>
          {era.label}
        </Text>
        {status === 'completed' && score && (
          <Text style={[type.caption, { color: colors.bronze }]}>{score.correct}/10 · {score.points} pts</Text>
        )}
        {status === 'locked' && (
          <Text style={[type.caption, { color: colors.parchmentDim }]}>Locked</Text>
        )}
        {status === 'current' && (
          <Text style={[type.caption, { color: colors.bronze }]}>Tap to play</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  disc: {
    width: 56, height: 56,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  meta: { flex: 1, gap: 2 },
});
