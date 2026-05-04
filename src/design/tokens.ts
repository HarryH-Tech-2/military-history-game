// src/design/tokens.ts
export const colors = {
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
