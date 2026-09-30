/**
 * Brand colour reference. The live values are CSS custom properties in
 * src/styles/tokens.css (light + dark themes); keep both in sync.
 */
export const BRAND_COLORS = {
  navy: '#071A2F',
  navy2: '#0B2A4A',
  blue: '#146EF5',
  blue2: '#267DFF',
  emerald: '#00A878',
  emerald2: '#087F5B',
  light: '#F5F8FC',
  white: '#FFFFFF',
  grey: '#E8EEF5',
  accent: '#FFB547',
  text: '#0A1628',
  muted: '#5D6B7A',
  dark: { bg: '#06111F', surface: '#081A2C', surface2: '#0D2238' },
} as const;

export const THEME_STORAGE_KEY = 'ya2-theme';
