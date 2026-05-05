import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { fetchAllTimeTop, fetchWeeklyTop, fetchUserRank, LeaderboardRow } from '../../services/leaderboard';
import { LeaderRow } from './LeaderRow';
import { colors, radii, spacing, type } from '../../design/tokens';
import { useAuth } from '../auth/useAuth';
import { useProgressStore } from '../../state/useProgressStore';

type Tab = 'weekly' | 'alltime';

export function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>('weekly');
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const totalPoints = useProgressStore(s => s.totalPoints);
  const [myRank, setMyRank] = useState<number | null>(null);

  const load = async () => {
    setRefreshing(true);
    const data = tab === 'weekly' ? await fetchWeeklyTop(100) : await fetchAllTimeTop(100);
    setRows(data);
    if (user) setMyRank(await fetchUserRank(user.uid, totalPoints));
    setRefreshing(false);
  };

  useEffect(() => { setRows(null); load(); }, [tab]);

  const inTop = !!user && rows?.some(r => r.uid === user.uid);

  return (
    <Screen padded={false}>
      <View style={styles.tabs}>
        {(['weekly', 'alltime'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[type.bodyBold, { color: tab === t ? colors.ink : colors.parchment }]}>
              {t === 'weekly' ? 'Weekly' : 'All-time'}
            </Text>
          </Pressable>
        ))}
      </View>
      {!rows ? (
        <ActivityIndicator color={colors.bronze} style={{ marginTop: spacing.xl }} />
      ) : rows.length === 0 ? (
        <Text style={[type.body, { color: colors.parchmentDim, textAlign: 'center', marginTop: spacing.xl }]}>
          Be the first on the board — play your first era.
        </Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={r => r.uid}
          renderItem={({ item, index }) => (
            <LeaderRow rank={index + 1} row={item} highlight={!!user && item.uid === user.uid} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.bronze} />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      )}
      {!inTop && user && myRank && (
        <View style={styles.stickyFooter}>
          <LeaderRow
            rank={myRank}
            row={{ uid: user.uid, displayName: user.displayName ?? 'You', photoURL: user.photoURL ?? null, points: totalPoints }}
            highlight
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, alignItems: 'center', backgroundColor: colors.inkSoft },
  tabActive: { backgroundColor: colors.bronze },
  stickyFooter: { borderTopWidth: 1, borderTopColor: colors.bronzeDeep, padding: spacing.sm, backgroundColor: colors.ink },
});
