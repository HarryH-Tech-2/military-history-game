import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { BattleHero } from './BattleHero';
import { ClueList } from './ClueList';
import { GuessInput } from './GuessInput';
import { ResultBanner } from './ResultBanner';
import { useGameStore } from '../../state/useGameStore';
import { spacing } from '../../design/tokens';
import * as Haptics from 'expo-haptics';
import { RoundResult } from '../../types';

export function RoundScreen({ onFinished }: { onFinished: () => void }) {
  const { battles, currentIndex, cluesRevealed, pointsAvailable, revealClue, submitGuess, status } = useGameStore();
  const [pendingResult, setPendingResult] = useState<RoundResult | null>(null);

  const battle = battles[currentIndex];
  if (!battle) return null;

  const handleSubmit = (guess: string) => {
    const result = submitGuess(guess);
    Haptics.notificationAsync(
      result.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    setPendingResult(result);
  };

  const handleContinue = () => {
    setPendingResult(null);
    if (status === 'finished') onFinished();
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <BattleHero battle={battle} />
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <ClueList clues={battle.hints} revealed={cluesRevealed} onReveal={revealClue} />
          <GuessInput
            pointsAvailable={pointsAvailable}
            onSubmit={handleSubmit}
            disabled={!!pendingResult}
          />
        </View>
      </ScrollView>
      {pendingResult && (
        <ResultBanner result={pendingResult} correctName={battle.name} onContinue={handleContinue} />
      )}
    </Screen>
  );
}
