import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'gold' | 'cyan' | 'surface' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'surface', size = 'sm' }) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: THEME.colors.primaryGlow, text: THEME.colors.primary, border: THEME.colors.primary };
      case 'gold':
        return { bg: THEME.colors.goldGlow, text: THEME.colors.gold, border: THEME.colors.gold };
      case 'cyan':
        return { bg: 'rgba(6, 182, 212, 0.2)', text: THEME.colors.cyan, border: THEME.colors.cyan };
      case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: THEME.colors.danger, border: THEME.colors.danger };
      default:
        return { bg: THEME.colors.surfaceHighlight, text: THEME.colors.textSecondary, border: THEME.colors.border };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor: border },
        size === 'sm' ? styles.sm : styles.md
      ]}
    >
      <Text style={[styles.text, { color: text }, size === 'sm' ? styles.textSm : styles.textMd]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5
  },
  textSm: {
    fontSize: 10
  },
  textMd: {
    fontSize: 12
  }
});
