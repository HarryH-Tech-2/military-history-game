import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { ERAS, EraId } from '../../data/eras';
import { useProgressStore } from '../../state/useProgressStore';
import { EraMedallion, EraStatus } from './EraMedallion';
import { colors, spacing, type } from '../../design/tokens';

export function PathScreen({ onStartEra }: { onStartEra: (id: EraId) => void }) {
  const { totalPoints, unlockedEras, currentEra, eraScores } = useProgressStore();

  const statusFor = (id: EraId): EraStatus => {
    if (eraScores[id]) return 'completed';
    if (id === currentEra && unlockedEras.includes(id)) return 'current';
    return 'locked';
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[type.caption, { color: colors.parchmentDim }]}>Total points</Text>
        <Text style={[type.display, { color: colors.bronze }]}>{totalPoints}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg }}>
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
  header: { alignItems: 'center', paddingVertical: spacing.md },
});
