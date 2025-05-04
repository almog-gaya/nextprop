// NextProp Design System

// Color palette
export const colors = {
  // Primary colors - Softer purple palette that coordinates with sidebar
  primary: {
    50: '#f3effb',
    100: '#e6dff7',
    200: '#d0c0ef',
    300: '#b5bcff', // sidebar gradient start
    400: '#a191e3',
    500: '#9d7afd', // adjusted secondary - softer
    600: '#9061fc', // adjusted primary - softer
    700: '#8344fb', // adjusted primary dark - softer
    800: '#7a32f8',
    900: '#6d28d9',
  },
  
  // Accent colors
  accent: {
    50: '#f5f0ff',
    100: '#ece1ff',
    200: '#e6c2ff', // sidebar gradient end
    300: '#d8b4fe',
    400: '#c591fd', // softer accent
    500: '#b77cfc', // softer accent
    600: '#a855f7',
    700: '#9333ea',
    800: '#7e22ce',
    900: '#6b21a8',
  },
  
  // Neutrals
  gray: {
    50: '#f8fafc', // nextprop-surface-hover
    100: '#f1f5f9',
    200: '#e2e8f0', // nextprop-border
    300: '#cbd5e1',
    400: '#94a3b8', // nextprop-text-tertiary
    500: '#64748b', // nextprop-text-secondary
    600: '#475569',
    700: '#334155',
    800: '#1e293b', // nextprop-text-primary
    900: '#0f172a',
    950: '#1e1b4b', // nextprop-dark
  },
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Surface colors
  surface: {
    light: '#ffffff', // nextprop-surface
    hover: '#f8fafc', // nextprop-surface-hover
  },
  
  white: '#ffffff',
  black: '#000000',
}

// Typography
export const typography = {
  fontFamily: {
    sans: 'Montserrat, system-ui, -apple-system, sans-serif',
    heading: 'Montserrat, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
}

// Spacing
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
}

// Borders
export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  width: {
    0: '0',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
}

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
}

// Common gradients
export const gradients = {
  // Sidebar gradient
  sidebar: `linear-gradient(to right, ${colors.primary[300]}, ${colors.accent[200]})`,
  
  // Button gradients
  buttonPrimary: `linear-gradient(to bottom, ${colors.primary[600]}, ${colors.primary[700]})`,
  buttonSecondary: `linear-gradient(to bottom, ${colors.primary[500]}, ${colors.primary[600]})`,
  
  // Card gradients
  card: `linear-gradient(to bottom, ${colors.surface.light}, ${colors.surface.hover})`,
  
  // Text gradients
  brandText: `linear-gradient(to right, ${colors.primary[600]}, ${colors.primary[500]}, ${colors.accent[500]})`,
}

// Animation timing
export const animation = {
  durations: {
    fast: '100ms',
    default: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },
  easings: {
    default: 'ease-in-out',
    in: 'ease-in',
    out: 'ease-out',
    linear: 'linear',
  },
}

// Design tokens as a single export
export const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  gradients,
  animation,
}

export default theme; 