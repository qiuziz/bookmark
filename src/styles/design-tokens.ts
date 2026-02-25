export const colors = {
  primary: '#4A90E2',
  primaryHover: '#357ABD',
  secondary: '#6C757D',
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  info: '#17A2B8',
  light: '#F8F9FA',
  dark: '#212529',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#DEE2E6',
  text: '#212529',
  textSecondary: '#6C757D',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowHover: 'rgba(0, 0, 0, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  frostedGlass: 'rgba(255, 255, 255, 0.4)',
  frostedGlassDark: 'rgba(30, 30, 30, 0.4)'
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px'
} as const;

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  xxl: '24px'
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
} as const;

export const transition = {
  fast: '0.15s ease',
  base: '0.3s ease',
  slow: '0.5s ease'
} as const;

export const shadow = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 8px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.1)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.15)'
} as const;

export const zIndex = {
  dropdown: 1000,
  modal: 2000,
  toast: 3000
} as const;
