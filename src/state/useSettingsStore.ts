import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePref = 'system' | 'light' | 'dark';

interface SettingsState {
  theme: ThemePref;
  haptics: boolean;
  dailyReminder: boolean;
  setTheme: (t: ThemePref) => void;
  setHaptics: (v: boolean) => void;
  setDailyReminder: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      haptics: true,
      dailyReminder: false,
      setTheme: (t) => set({ theme: t }),
      setHaptics: (v) => set({ haptics: v }),
      setDailyReminder: (v) => set({ dailyReminder: v }),
    }),
    { name: 'mhg-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
