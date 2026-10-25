import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#151514',
    background: '#f2f1ed',
    card: '#faf9f6',
    cardBorder: 'rgba(21, 21, 20, 0.09)',
    backgroundElement: '#e8e6e0',
    backgroundSelected: '#dedbd2',
    surfaceInset: 'rgba(21, 21, 20, 0.035)',
    textSecondary: '#6f6d67',
    textSubtle: '#9a9890',
    primary: '#171716',
    primaryForeground: '#f6f4ef',
    destructive: '#a2544a',
    border: 'rgba(21, 21, 20, 0.09)',
    borderSubtle: 'rgba(21, 21, 20, 0.05)',
    star: '#8a6b34',
    emerald: '#4f7357',
    crimson: '#a2544a',
    amber: '#8a6b34',
    blue: '#5c6b7a',
  },
  dark: {
    text: '#f4f4f2',
    background: '#08090b',
    card: '#121316',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    backgroundElement: '#17181c',
    backgroundSelected: '#202227',
    surfaceInset: 'rgba(255, 255, 255, 0.035)',
    textSecondary: '#8a8c92',
    textSubtle: '#5f6065',
    primary: '#f2f1ec',
    primaryForeground: '#0a0a0b',
    destructive: '#c99a90',
    border: 'rgba(255, 255, 255, 0.07)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    star: '#d2bd93',
    emerald: '#a9bfa9',
    crimson: '#c99a90',
    amber: '#d2bd93',
    blue: '#a6b0bd',
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
