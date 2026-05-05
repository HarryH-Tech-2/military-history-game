import React, { useRef, useState } from 'react';
import { Animated, ImageBackground, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../design/components/Screen';
import { ERAS, EraId } from '../../data/eras';
import { useProgressStore } from '../../state/useProgressStore';
import { EraMedallion, EraStatus } from './EraMedallion';
import { spacing } from '../../design/tokens';
import { PlayerBanner } from './PlayerBanner';
import { useAuth } from '../auth/useAuth';
import { eraBackgrounds } from './eraBackgrounds';

// Approximate height per medallion row. Used to map scroll position to era index.
const ROW_HEIGHT = 88;

export function PathScreen({ onStartEra }: { onStartEra: (id: EraId) => void }) {
  const { unlockedEras, currentEra, eraScores } = useProgressStore();
  const { user } = useAuth();
  const [activeEra, setActiveEra] = useState<EraId>(ERAS[0].id);
  const fade = useRef(new Animated.Value(1)).current;
  const previousEra = useRef<EraId>(ERAS[0].id);
  const incomingEra = useRef<EraId>(ERAS[0].id);

  const statusFor = (id: EraId): EraStatus => {
    if (eraScores[id]) return 'completed';
    if (id === currentEra && unlockedEras.includes(id)) return 'current';
    return 'locked';
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.min(ERAS.length - 1, Math.max(0, Math.round(y / ROW_HEIGHT)));
    const next = ERAS[idx].id;
    if (next !== activeEra) {
      // Crossfade: keep the previous image visible underneath while the new one fades in.
      previousEra.current = activeEra;
      incomingEra.current = next;
      fade.setValue(0);
      setActiveEra(next);
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  };

  return (
    <Screen padded={false}>
      {/* Background layers — previous behind, incoming fading in on top */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {eraBackgrounds[previousEra.current] && (
          <ImageBackground
            source={eraBackgrounds[previousEra.current] as number}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
        {eraBackgrounds[activeEra] && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
            <ImageBackground
              source={eraBackgrounds[activeEra] as number}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </Animated.View>
        )}
        <LinearGradient
          colors={['rgba(14,27,44,0.55)', 'rgba(14,27,44,0.85)', 'rgba(14,27,44,0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.bannerWrap}>
        <PlayerBanner displayName={user?.displayName} photoURL={user?.photoURL} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {ERAS.map(era => (
          <EraMedallion
            key={era.id}
            era={era}
            status={statusFor(era.id)}
            score={eraScores[era.id]}
            onPress={() => onStartEra(era.id)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerWrap: { paddingHorizontal: spacing.xs },
});
