import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, Palette } from './tokens';
import { useSettingsStore } from '../state/useSettingsStore';

/**
 * Returns the active palette based on the user's theme preference and the OS color scheme.
 * Components that should respond to the theme toggle should use this hook
 * instead of importing `colors` from `tokens.ts` directly.
 */
export function useColors(): Palette {
  const themePref = useSettingsStore(s => s.theme);
  const system = useColorScheme();
  const effective = themePref === 'system' ? (system ?? 'dark') : themePref;
  return effective === 'light' ? lightPalette : darkPalette;
}

export function useIsDark(): boolean {
  const themePref = useSettingsStore(s => s.theme);
  const system = useColorScheme();
  const effective = themePref === 'system' ? (system ?? 'dark') : themePref;
  return effective !== 'light';
}
