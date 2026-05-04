import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../design/components/Card';
import { Button } from '../../design/components/Button';
import { colors, spacing, type } from '../../design/tokens';
import { MAX_CLUES } from '../../game/scoring';

export function ClueList({
  clues, revealed, onReveal,
}: {
  clues: string[];
  revealed: number;
  onReveal: () => void;
}) {
  const visible = clues.slice(0, revealed);
  const canReveal = revealed < MAX_CLUES && revealed < clues.length;

  return (
    <Card style={{ gap: spacing.sm }}>
      {visible.map((c, i) => (
        <Animated.View key={i} entering={FadeInDown.duration(220).delay(i * 60)}>
          <View style={styles.row}>
            <Text style={[type.bodyBold, styles.num]}>{i + 1}.</Text>
            <Text style={[type.body, styles.text]}>{c}</Text>
          </View>
        </Animated.View>
      ))}
      {canReveal && (
        <Button label="Reveal another clue (-2 pts)" variant="secondary" onPress={onReveal} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  num: { color: colors.bronze, width: 22 },
  text: { color: colors.parchment, flex: 1 },
});
