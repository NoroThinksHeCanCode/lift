export const THEME = {
  colors: {
    // Ultra-minimalist dark palette
    bg: '#08090B',
    surface: '#111215',
    surfaceElevated: '#17191E',
    surfaceHighlight: '#20232B',
    border: '#1F2228',
    borderSubtle: '#17191E',

    // Restrained, clean accents
    primary: '#10B981',       // Clean Mint/Emerald
    primaryMuted: '#064E3B',
    primaryGlow: 'rgba(16, 185, 129, 0.12)',

    accent: '#6366F1',        // Indigo
    cyan: '#06B6D4',          // Rest timer
    gold: '#F59E0B',          // Personal Record (PR) Trophy
    goldGlow: 'rgba(245, 158, 11, 0.15)',
    danger: '#EF4444',        // Destructive

    // Clean typography & contrast
    textPrimary: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    textInverse: '#08090B',

    // Olympic Plate Standards
    plateColors: {
      red: '#EF4444',
      blue: '#3B82F6',
      yellow: '#EAB308',
      green: '#10B981',
      white: '#E5E7EB',
      gray: '#6B7280',
      darkGray: '#374151'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999
  }
} as const;
