import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RoundResult } from '../../types';
import { colors, radii, spacing, type } from '../../design/tokens';

export function ResultBanner({
  result, correctName, onContinue,
}: {
  result: RoundResult;
  correctName: string;
  onContinue: () => void;
}) {
  const tone = result.correct ? colors.victory : colors.defeat;
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.overlay}>
      <Pressable style={styles.card} onPress={onContinue}>
        <View style={[styles.tag, { backgroundColor: tone }]}>
          <Text style={[type.bodyBold, { color: colors.ink }]}>
            {result.correct ? 'Correct!' : 'Incorrect'}
          </Text>
        </View>
        <Text style={[type.title, styles.name]}>{correctName}</Text>
        <Text style={[type.body, styles.points]}>
          {result.correct ? `+${result.pointsEarned} points` : 'Better luck next time'}
        </Text>
        <Text style={[type.caption, styles.tap]}>Tap to continue</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.inkSoft, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm, alignItems: 'center' },
  tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill },
  name: { color: colors.parchment, textAlign: 'center' },
  points: { color: colors.parchment },
  tap: { color: colors.parchmentDim, marginTop: spacing.md },
});
