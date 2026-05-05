// Thin wrapper over expo-haptics that respects the user's haptics setting.
// Usage: import { haptics } from '../services/haptics'; haptics.success();

import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../state/useSettingsStore';

function enabled(): boolean {
  return useSettingsStore.getState().haptics;
}

export const haptics = {
  selection: () => {
    if (enabled()) Haptics.selectionAsync();
  },
  success: () => {
    if (enabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    if (enabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    if (enabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (enabled()) Haptics.impactAsync(style);
  },
};
