export const THEME = {
  colors: {
    // Pure AMOLED Pitch Black (Instagram Android Dark Mode style)
    bg: '#000000',
    surface: '#000000',
    surfaceElevated: '#121212',
    surfaceHighlight: '#1A1A1A',
    border: '#262626',
    borderSubtle: '#1C1C1C',

    // Clean accents
    primary: '#10B981',       // Clean Emerald/Mint
    primaryMuted: '#064E3B',
    primaryGlow: 'rgba(16, 185, 129, 0.15)',

    accent: '#6366F1',        // Indigo
    cyan: '#06B6D4',          // Rest timer cyan
    gold: '#F59E0B',          // Personal Record (PR) Trophy
    goldGlow: 'rgba(245, 158, 11, 0.15)',
    danger: '#EF4444',        // Destructive

    // Crisp Instagram Dark Mode Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#A8A8A8',
    textMuted: '#737373',
    textInverse: '#000000',

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
