import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Battle } from '../../types';
import { battleImages } from '../../data/battleImages';
import { colors } from '../../design/tokens';

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

  return (
    <View style={[styles.wrap, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        {source ? (
          <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.inkSoft }]} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: colors.inkSoft },
});
