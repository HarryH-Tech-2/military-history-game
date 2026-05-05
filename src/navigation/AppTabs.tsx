import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PathScreen } from '../features/progress/PathScreen';
import { LeaderboardScreen } from '../features/leaderboard/LeaderboardScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { TabParamList, RootStackParamList } from './types';
import { useColors } from '../design/useColors';

const Tab = createBottomTabNavigator<TabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const TAB_ICONS: Record<keyof TabParamList, { active: IconName; inactive: IconName }> = {
  Path:        { active: 'map',          inactive: 'map-outline' },
  Leaderboard: { active: 'trophy',       inactive: 'trophy-outline' },
  Profile:     { active: 'person-circle', inactive: 'person-circle-outline' },
};

export function AppTabs() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.ink,
          borderTopColor: colors.bronzeDeep,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.bronze,
        tabBarInactiveTintColor: colors.parchmentDim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const name = TAB_ICONS[route.name as keyof TabParamList];
          return <Ionicons name={focused ? name.active : name.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Path">
        {() => <PathScreen onStartEra={(eraId) => nav.navigate('Round', { eraId })} />}
      </Tab.Screen>
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
