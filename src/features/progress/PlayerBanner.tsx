import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadow, spacing, type } from '../../design/tokens';
import { useColors } from '../../design/useColors';
import { useProgressStore } from '../../state/useProgressStore';
import { ERAS, EraId } from '../../data/eras';

export interface PlayerBannerProps {
  displayName?: string | null;
  photoURL?: string | null;
}

export function PlayerBanner({ displayName, photoURL }: PlayerBannerProps) {
  const colors = useColors();
  const { totalPoints, eraScores, currentEra } = useProgressStore();
  const erasCompleted = Object.keys(eraScores).length;
  const currentLabel = ERAS.find(e => e.id === (currentEra as EraId))?.label ?? 'Ancient World';
  const name = displayName ?? 'Player';

  return (
    <View style={[styles.wrap, shadow.card]}>
      <LinearGradient
        colors={[colors.bronzeDeep, colors.bronze, colors.bronzeDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.ink }]}>
            <Ionicons name="person" size={28} color={colors.parchment} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text numberOfLines={1} style={[type.title, { color: '#0E1B2C' }]}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="flame" size={14} color="#0E1B2C" />
              <Text style={[type.caption, styles.metaText]}>{totalPoints} pts</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: '#0E1B2C' }]} />
            <View style={styles.metaItem}>
              <Ionicons name="ribbon-outline" size={14} color="#0E1B2C" />
              <Text style={[type.caption, styles.metaText]}>{erasCompleted}/8 eras</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={[type.caption, styles.currentEra]}>
            Currently: {currentLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0E1B2C',
  },
  avatarFallback: {
    alignItems: 'center', justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  metaText: { color: '#0E1B2C', fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.5 },
  currentEra: {
    color: '#0E1B2C',
    opacity: 0.75,
    fontStyle: 'italic',
  },
});
