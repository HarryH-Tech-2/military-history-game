import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design/components/Card';
import { radii, spacing, type } from '../../design/tokens';
import { useColors } from '../../design/useColors';
import { useSettingsStore, ThemePref } from '../../state/useSettingsStore';
import { haptics } from '../../services/haptics';
import {
  cancelDailyReminder,
  ensureNotificationPermission,
  scheduleDailyReminder,
} from '../../services/notifications';

const THEME_OPTIONS: { value: ThemePref; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light',  label: 'Light',  icon: 'sunny-outline' },
  { value: 'dark',   label: 'Dark',   icon: 'moon-outline' },
];

export function SettingsList() {
  const colors = useColors();
  const { theme, haptics: hapticsOn, dailyReminder, setTheme, setHaptics, setDailyReminder } =
    useSettingsStore();
  const [reminderBusy, setReminderBusy] = useState(false);

  const handleTheme = (value: ThemePref) => {
    haptics.selection();
    setTheme(value);
  };

  const handleHaptics = (value: boolean) => {
    setHaptics(value);
    if (value) haptics.selection();
  };

  const handleDailyReminder = async (value: boolean) => {
    setReminderBusy(true);
    try {
      if (value) {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Notifications disabled',
            'Enable notifications for Military History in your device settings to receive reminders.',
          );
          return;
        }
        await scheduleDailyReminder();
        setDailyReminder(true);
      } else {
        await cancelDailyReminder();
        setDailyReminder(false);
      }
    } catch (e) {
      Alert.alert('Could not update reminder', (e as Error).message);
    } finally {
      setReminderBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={[type.caption, { color: colors.parchmentDim, marginLeft: spacing.xs }]}>APPEARANCE</Text>
      <Card style={{ gap: spacing.sm, padding: spacing.md }}>
        <Text style={[type.body, { color: colors.parchment }]}>Theme</Text>
        <View style={styles.segmented}>
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleTheme(opt.value)}
                style={[
                  styles.segment,
                  {
                    backgroundColor: active ? colors.bronze : 'transparent',
                    borderColor: colors.bronzeDeep,
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={active ? '#0E1B2C' : colors.parchmentDim}
                />
                <Text
                  style={[
                    type.bodyBold,
                    { color: active ? '#0E1B2C' : colors.parchment },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text style={[type.caption, { color: colors.parchmentDim, marginLeft: spacing.xs }]}>FEEDBACK</Text>
      <Card style={{ padding: 0 }}>
        <Row
          icon="phone-portrait-outline"
          label="Vibration"
          subtitle="Haptic feedback on guesses"
          right={<Switch value={hapticsOn} onValueChange={handleHaptics}
            trackColor={{ false: colors.bronzeDeep, true: colors.bronze }}
            thumbColor={colors.parchment} />}
        />
        <Divider />
        <Row
          icon="notifications-outline"
          label="Daily reminder"
          subtitle="A nudge at 7pm to keep your streak"
          right={<Switch
            value={dailyReminder}
            disabled={reminderBusy}
            onValueChange={handleDailyReminder}
            trackColor={{ false: colors.bronzeDeep, true: colors.bronze }}
            thumbColor={colors.parchment}
          />}
        />
      </Card>
    </View>
  );
}

function Row({
  icon, label, subtitle, right,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  right: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderColor: colors.bronzeDeep }]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.bronze} />
        <View style={{ flex: 1 }}>
          <Text style={[type.body, { color: colors.parchment }]}>{label}</Text>
          {subtitle && (
            <Text style={[type.caption, { color: colors.parchmentDim, marginTop: 2 }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {right}
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.bronzeDeep, opacity: 0.3 }} />;
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
