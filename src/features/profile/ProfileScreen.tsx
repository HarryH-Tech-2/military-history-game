import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { Card } from '../../design/components/Card';
import { useAuth } from '../auth/useAuth';
import { useProgressStore } from '../../state/useProgressStore';
import { colors, spacing, type } from '../../design/tokens';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { totalPoints, eraScores } = useProgressStore();
  const erasCompleted = Object.keys(eraScores).length;

  return (
    <Screen>
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
      <View style={{ marginTop: spacing.xl }}>
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
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
