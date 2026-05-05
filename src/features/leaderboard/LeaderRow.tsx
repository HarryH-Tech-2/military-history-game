import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LeaderboardRow } from '../../services/leaderboard';
import { colors, radii, spacing, type } from '../../design/tokens';

export function LeaderRow({ rank, row, highlight }: { rank: number; row: LeaderboardRow; highlight?: boolean }) {
  return (
    <View style={[styles.row, highlight && styles.highlight]}>
      <Text style={[type.bodyBold, styles.rank]}>{rank}</Text>
      {row.photoURL
        ? <Image source={{ uri: row.photoURL }} style={styles.avatar} />
        : <View style={[styles.avatar, styles.avatarFallback]} />}
      <Text style={[type.body, styles.name]} numberOfLines={1}>{row.displayName}</Text>
      <Text style={[type.bodyBold, styles.pts]}>{row.points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.md },
  highlight: { backgroundColor: colors.bronzeDeep, borderRadius: radii.md },
  rank: { color: colors.parchmentDim, width: 32, textAlign: 'right' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { backgroundColor: colors.inkSoft },
  name: { color: colors.parchment, flex: 1 },
  pts: { color: colors.bronze },
});
