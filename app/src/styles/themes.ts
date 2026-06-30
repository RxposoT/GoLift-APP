export const lightTheme = {
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#E5E5EA',

  text: '#000000',
  textSecondary: '#6C6C70',
  textTertiary: '#AEAEB2',

  border: '#E5E5EA',
  borderLight: '#F2F2F7',

  primary: '#005CE6',
  accent: '#005CE6',
  accentGreen: '#34C759',
  accentBlue: '#005CE6',

  streakBase: '#F2F2F7',
};

export const darkTheme = {
  background: '#080808',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',

  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',

  border: '#2C2C2E',
  borderLight: '#1C1C1E',

  primary: '#0A84FF',
  accent: '#0A84FF',
  accentGreen: '#30D158',
  accentBlue: '#0A84FF',

  streakBase: '#1C1C1E',
};

export const typography = {
  display:   { fontSize: 52, fontWeight: '800' as const, letterSpacing: -2 },
  title1:    { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1 },
  title2:    { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  title3:    { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  headline:  { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
  body:      { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0 },
  callout:   { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0 },
  subhead:   { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.1 },
  footnote:  { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.1 },
  caption:   { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
};

export type Typography = typeof typography;

export type Theme = typeof lightTheme;
