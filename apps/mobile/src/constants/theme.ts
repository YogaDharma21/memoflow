import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#ffffff',
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    backgroundElement: '#f3f4f6',
    backgroundSelected: '#e5e7eb',
    textSecondary: '#6b7280',
    primary: '#111827',
    primaryForeground: '#ffffff',
    destructive: '#ef4444',
    border: '#e5e7eb',
    star: '#f59e0b',
  },
  dark: {
    text: '#f9fafb',
    background: '#09090b',
    card: '#18181b',
    cardBorder: '#27272a',
    backgroundElement: '#27272a',
    backgroundSelected: '#3f3f46',
    textSecondary: '#a1a1aa',
    primary: '#f9fafb',
    primaryForeground: '#09090b',
    destructive: '#f87171',
    border: '#27272a',
    star: '#fbbf24',
  },
} as const;

export type ThemeColors = typeof Colors.light;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
