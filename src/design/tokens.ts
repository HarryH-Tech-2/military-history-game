// src/design/tokens.ts
// Theme palettes. The dark palette is the original/canonical look;
// light is a parchment-leaning daytime variant.

export type Palette = {
  ink: string;
  inkSoft: string;
  parchment: string;
  parchmentDim: string;
  bronze: string;
  bronzeDeep: string;
  victory: string;
  defeat: string;
  overlay: string;
};

export const darkPalette: Palette = {
  ink: '#0E1B2C',
  inkSoft: '#1A2A40',
  parchment: '#F2E8D5',
  parchmentDim: '#C9BFA8',
  bronze: '#C8923B',
  bronzeDeep: '#8E6321',
  victory: '#3FAE7B',
  defeat: '#D7544A',
  overlay: 'rgba(14,27,44,0.72)',
} as const;

export const lightPalette: Palette = {
  // Background tones flip to warm parchment, with deep ink reserved for text/accents.
  ink: '#F4ECDA',          // page background (was the dark surface)
  inkSoft: '#E8DCC0',      // raised surfaces / cards
  parchment: '#1F2A3A',    // primary text (was light)
  parchmentDim: '#5C6678', // secondary text
  bronze: '#A66B1F',       // bronze stays warm but a touch deeper for AA contrast
  bronzeDeep: '#7A4A12',
  victory: '#2F8A5F',
  defeat: '#B8413B',
  overlay: 'rgba(244,236,218,0.86)',
} as const;

// Default export for backwards compatibility.
// Modules importing `colors` directly get the dark palette (the long-standing default).
// Components that should respond to user preference must use `useColors()` instead.
export const colors = darkPalette;

export const spacing = {
  xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radii = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const type = {
  display: { fontFamily: 'Fraunces_700Bold', fontSize: 32, lineHeight: 38 },
  title:   { fontFamily: 'Fraunces_700Bold', fontSize: 24, lineHeight: 28 },
  body:    { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 22 },
  bodyBold:{ fontFamily: 'Inter_700Bold',    fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  button:  { fontFamily: 'Inter_700Bold',    fontSize: 16, lineHeight: 20 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
