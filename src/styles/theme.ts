export const theme = {
  colors: {
    primary: '#f2e974',
    primaryContainer: '#f2e974',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#6e6800',
    onPrimaryFixed: '#1e1c00',
    primaryFixed: '#efe672',
    primaryFixedDim: '#d2ca59',
    onPrimaryFixedVariant: '#4d4800',
    inversePrimary: '#d2ca59',

    secondary: '#5f5e5e',
    onSecondary: '#ffffff',
    secondaryContainer: '#e5e2e1',
    onSecondaryContainer: '#656464',

    tertiary: '#006972',
    onTertiary: '#ffffff',
    tertiaryContainer: '#9ef3ff',
    onTertiaryContainer: '#00717c',

    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',

    surface: '#f9f9f9',
    surfaceDim: '#dadada',
    surfaceBright: '#f9f9f9',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f3f3f3',
    surfaceContainer: '#eeeeee',
    surfaceContainerHigh: '#e8e8e8',
    surfaceContainerHighest: '#e2e2e2',
    surfaceVariant: '#e2e2e2',
    surfaceTint: '#666000',
    onSurface: '#1a1c1c',
    onSurfaceVariant: '#494737',
    inverseSurface: '#2f3131',
    inverseOnSurface: '#f1f1f1',

    outline: '#7a7865',
    outlineVariant: '#cbc7b1',

    background: '#f9f9f9',
    onBackground: '#1a1c1c',
  },

  radius: {
    default: '0.125rem',
    lg: '0.25rem',
    xl: '0.5rem',
    full: '0.75rem',
  },

  fonts: {
    geist: "'Geist', 'Noto Sans KR', system-ui, sans-serif",
    inter: "'Inter', 'Noto Sans KR', system-ui, sans-serif",
    mono: "'Geist', 'Noto Sans KR', 'Courier New', monospace",
  },

  spacing: {
    unit: '8px',
    gutter: '24px',
  },
} as const;

export type Theme = typeof theme;
