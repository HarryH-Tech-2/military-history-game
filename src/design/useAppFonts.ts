// src/design/useAppFonts.ts
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces';

export function useAppFonts() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Fraunces_700Bold,
  });
  return loaded;
}
