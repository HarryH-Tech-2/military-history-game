import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PathScreen } from '../features/progress/PathScreen';
import { LeaderboardScreen } from '../features/leaderboard/LeaderboardScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { TabParamList, RootStackParamList } from './types';
import { colors } from '../design/tokens';

const Tab = createBottomTabNavigator<TabParamList>();

export function AppTabs() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.bronzeDeep },
        tabBarActiveTintColor: colors.bronze,
        tabBarInactiveTintColor: colors.parchmentDim,
      }}
    >
      <Tab.Screen name="Path">
        {() => <PathScreen onStartEra={(eraId) => nav.navigate('Round', { eraId })} />}
      </Tab.Screen>
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
