import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { ERAS, EraId } from '../../data/eras';
import { useProgressStore } from '../../state/useProgressStore';
import { EraMedallion, EraStatus } from './EraMedallion';
import { spacing } from '../../design/tokens';
import { PlayerBanner } from './PlayerBanner';
import { useAuth } from '../auth/useAuth';

export function PathScreen({ onStartEra }: { onStartEra: (id: EraId) => void }) {
  const { unlockedEras, currentEra, eraScores } = useProgressStore();
  const { user } = useAuth();

  const statusFor = (id: EraId): EraStatus => {
    if (eraScores[id]) return 'completed';
    if (id === currentEra && unlockedEras.includes(id)) return 'current';
    return 'locked';
  };

  return (
    <Screen padded={false}>
      <View style={styles.bannerWrap}>
        <PlayerBanner displayName={user?.displayName} photoURL={user?.photoURL} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
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
