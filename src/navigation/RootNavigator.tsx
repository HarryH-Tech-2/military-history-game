import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/useAuth';
import { useOnboardingStore } from '../state/useOnboardingStore';
import { useGameStore } from '../state/useGameStore';
import { AppTabs } from './AppTabs';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { RoundScreen } from '../features/game/RoundScreen';
import { EraSummary } from '../features/game/EraSummary';
import { getBattlesForEra } from '../data/eras';
import { commitEraCompletion } from '../services/eraCompletion';
import { useProgressStore } from '../state/useProgressStore';
import { colors } from '../design/tokens';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RoundRoute({ route }: any) {
  const { eraId } = route.params;
  const { user } = useAuth();
  const startRound = useGameStore(s => s.startRound);
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (user) startRound(eraId, getBattlesForEra(eraId, user.uid));
  }, [eraId, user, startRound]);

  return <RoundScreen onFinished={() => navigation.replace('Summary', { eraId })} />;
}

function SummaryRoute({ route }: any) {
  const { eraId } = route.params;
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const completeEra = useProgressStore(s => s.completeEra);
  const results = useGameStore(s => s.results);

  const handleContinue = async () => {
    if (!user) return;
    const correct = results.filter(r => r.correct).length;
    const points = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    completeEra(eraId, { correct, points });
    try {
      await commitEraCompletion({
        uid: user.uid, displayName: user.displayName ?? 'Player', photoURL: user.photoURL ?? null,
        eraId, correct, points,
      });
    } catch (e) {
      console.warn('era commit failed', e);
    }
    navigation.popToTop();
  };

  const handleRetry = () => {
    if (!user) return;
    useGameStore.getState().startRound(eraId, getBattlesForEra(eraId, `${user.uid}:${Date.now()}`));
    navigation.replace('Round', { eraId });
  };

  return <EraSummary eraId={eraId} onContinue={handleContinue} onRetry={handleRetry} />;
}

export function RootNavigator() {
  const { user, initializing } = useAuth();
  const seen = useOnboardingStore(s => s.seen);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.bronze} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!seen ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen name="Round" component={RoundRoute} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Summary" component={SummaryRoute} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
