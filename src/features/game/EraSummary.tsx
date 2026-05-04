import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { Card } from '../../design/components/Card';
import { colors, spacing, type } from '../../design/tokens';
import { useGameStore } from '../../state/useGameStore';
import { eraUnlockThreshold, battlesPerEra } from '../../game/scoring';
import { ERAS, EraId } from '../../data/eras';

export function EraSummary({ eraId, onContinue, onRetry }: {
  eraId: EraId;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const results = useGameStore(s => s.results);
  const correct = results.filter(r => r.correct).length;
  const points = results.reduce((sum, r) => sum + r.pointsEarned, 0);
  const passed = correct >= eraUnlockThreshold;
  const era = ERAS.find(e => e.id === eraId)!;

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={[type.display, { color: colors.parchment, textAlign: 'center' }]}>
          {era.label}
        </Text>
        <Card style={styles.scoreCard}>
          <Text style={[type.title, { color: passed ? colors.victory : colors.defeat, textAlign: 'center' }]}>
            {correct} / {battlesPerEra}
          </Text>
          <Text style={[type.body, { color: colors.parchment, textAlign: 'center' }]}>
            {points} points
          </Text>
          {passed ? (
            <Text style={[type.bodyBold, { color: colors.bronze, textAlign: 'center' }]}>
              Next era unlocked!
            </Text>
          ) : (
            <Text style={[type.body, { color: colors.parchmentDim, textAlign: 'center' }]}>
              Need {eraUnlockThreshold} correct to unlock the next era.
            </Text>
          )}
        </Card>
        {passed
          ? <Button label="Continue" onPress={onContinue} />
          : <Button label="Try again" onPress={onRetry} />
        }
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  scoreCard: { gap: spacing.sm, alignItems: 'stretch' },
});
