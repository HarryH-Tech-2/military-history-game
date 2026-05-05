import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeCarousel } from '../features/onboarding/WelcomeCarousel';
import { useOnboardingStore } from '../state/useOnboardingStore';

const Stack = createNativeStackNavigator();

export function OnboardingStack() {
  const markSeen = useOnboardingStore(s => s.markSeen);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome">
        {() => <WelcomeCarousel onDone={markSeen} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
