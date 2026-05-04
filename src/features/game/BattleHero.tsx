import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Battle } from '../../types';
import { battleImages } from '../../data/battleImages';
import { Chip } from '../../design/components/Chip';
import { colors, spacing } from '../../design/tokens';

export function BattleHero({ battle }: { battle: Battle }) {
  const { width } = useWindowDimensions();
  const height = Math.round(width * 0.62);
  const zoom = useSharedValue(1);

  React.useEffect(() => {
    zoom.value = 1;
    zoom.value = withRepeat(withTiming(1.06, { duration: 6000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [battle.id, zoom]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));
  const source = battleImages[battle.id];
  const yearLabel = battle.year < 0 ? `${Math.abs(battle.year)} BC` : `${battle.year} AD`;

  return (
    <View style={[styles.wrap, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        {source ? (
          <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.inkSoft }]} />
        )}
      </Animated.View>
      <View style={styles.vignette} />
      <View style={styles.chipRow}>
        <Chip label={`Year: ${yearLabel}`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: colors.inkSoft },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderColor: colors.ink,
    borderWidth: 18,
    borderRadius: 8,
    opacity: 0.5,
  },
  chipRow: { position: 'absolute', bottom: spacing.md, left: spacing.md },
});
