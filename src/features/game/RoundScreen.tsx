import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { Screen } from '../../design/components/Screen';
import { BattleHero } from './BattleHero';
import { ClueList } from './ClueList';
import { GuessInput, GuessInputHandle } from './GuessInput';
import { ResultBanner } from './ResultBanner';
import { useGameStore } from '../../state/useGameStore';
import { colors, spacing } from '../../design/tokens';
import { haptics } from '../../services/haptics';
import { RoundResult } from '../../types';

export function RoundScreen({ onFinished }: { onFinished: () => void }) {
  const { battles, currentIndex, cluesRevealed, pointsAvailable, revealClue, submitGuess, status, results } =
    useGameStore();
  const [pendingResult, setPendingResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<GuessInputHandle>(null);
  // useNavigation can throw when this component is rendered outside a NavigationContainer
  // (e.g. unit tests). Tolerate that.
  let navigation: NavigationProp<ParamListBase> | undefined;
  try {
    navigation = useNavigation<NavigationProp<ParamListBase>>();
  } catch {
    navigation = undefined;
  }

  const battle = battles[currentIndex];
  if (!battle) return null;

  const handleSubmit = (guess: string) => {
    const result = submitGuess(guess);
    if (result.correct) haptics.success();
    else haptics.error();
    if (!result.correct) inputRef.current?.shake();
    setPendingResult(result);
  };

  const handleContinue = () => {
    setPendingResult(null);
    if (status === 'finished') onFinished();
  };

  const handleClose = () => {
    const hasProgress = results.length > 0 || cluesRevealed > 1;
    if (!hasProgress) {
      navigation?.goBack();
      return;
    }
    Alert.alert(
      'Abandon this round?',
      'Your progress for this era will be lost.',
      [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => navigation?.goBack() },
      ],
    );
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <BattleHero battle={battle} />
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <ClueList clues={battle.hints} revealed={cluesRevealed} onReveal={revealClue} />
          <GuessInput
            ref={inputRef}
            pointsAvailable={pointsAvailable}
            onSubmit={handleSubmit}
            disabled={!!pendingResult}
          />
        </View>
      </ScrollView>
      <Pressable
        onPress={handleClose}
        hitSlop={12}
        style={styles.closeButton}
        accessibilityRole="button"
        accessibilityLabel="Close round"
      >
        <Ionicons name="close" size={24} color={colors.parchment} />
      </Pressable>
      {pendingResult && (
        <ResultBanner result={pendingResult} correctName={battle.name} onContinue={handleContinue} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14,27,44,0.6)',
    borderWidth: 1,
    borderColor: colors.bronzeDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
