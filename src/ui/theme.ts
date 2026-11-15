import { useColorScheme } from 'react-native';

export const palette = {
  teal: '#0F766E',
  coral: '#F97362',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
};

const light = {
  bg: '#F7FAF9',
  card: '#FFFFFF',
  ink: '#12312E',
  muted: '#5B7370',
  border: '#D5E3E0',
  primary: palette.teal,
  accent: palette.coral,
  onPrimary: '#FFFFFF',
};

const dark: typeof light = {
  bg: '#0B1B19',
  card: '#13302D',
  ink: '#E6F2F0',
  muted: '#9DB8B4',
  border: '#24473F',
  primary: '#2DB5A8',
  accent: palette.coral,
  onPrimary: '#052321',
};

export type Theme = typeof light & { status: typeof palette; radius: number; space: (n: number) => number };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? dark : light;
  return { ...base, status: palette, radius: 16, space: (n: number) => n * 8 };
}
