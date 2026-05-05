import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { Card } from '../../design/components/Card';
import { useAuth } from '../auth/useAuth';
import { useProgressStore } from '../../state/useProgressStore';
import { spacing, type } from '../../design/tokens';
import { useColors } from '../../design/useColors';
import { SettingsList } from './SettingsList';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { totalPoints, eraScores } = useProgressStore();
  const colors = useColors();
  const erasCompleted = Object.keys(eraScores).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg }}>
          {user?.photoURL
            ? <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            : <View style={[styles.avatar, { backgroundColor: colors.inkSoft }]} />}
          <Text style={[type.title, { color: colors.parchment }]}>{user?.displayName ?? 'Player'}</Text>
        </View>
        <Card style={{ gap: spacing.sm }}>
          <Stat label="Total points" value={String(totalPoints)} />
          <Stat label="Eras completed" value={`${erasCompleted} / 8`} />
        </Card>

        <SettingsList />

        <View style={{ marginTop: spacing.lg }}>
          <Button label="Sign out" variant="secondary" onPress={signOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[type.body, { color: colors.parchmentDim }]}>{label}</Text>
      <Text style={[type.bodyBold, { color: colors.bronze }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 96, height: 96, borderRadius: 48 },
});
