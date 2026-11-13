import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { THEME } from '../../constants/theme';
import { triggerHapticSelection } from '../../utils/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    triggerHapticSelection();
    onPress();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          btn: { backgroundColor: THEME.colors.primary },
          text: { color: '#0A0C10', fontWeight: '700' as const }
        };
      case 'secondary':
        return {
          btn: { backgroundColor: THEME.colors.surfaceElevated, borderWidth: 1, borderColor: THEME.colors.border },
          text: { color: THEME.colors.textPrimary, fontWeight: '600' as const }
        };
      case 'gold':
        return {
          btn: { backgroundColor: THEME.colors.gold },
          text: { color: '#0A0C10', fontWeight: '700' as const }
        };
      case 'danger':
        return {
          btn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: THEME.colors.danger },
          text: { color: THEME.colors.danger, fontWeight: '600' as const }
        };
      case 'ghost':
        return {
          btn: { backgroundColor: 'transparent' },
          text: { color: THEME.colors.textSecondary, fontWeight: '600' as const }
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24, fontSize: 17 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 18, fontSize: 15 };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        vStyles.btn,
        {
          paddingVertical: sStyles.paddingVertical,
          paddingHorizontal: sStyles.paddingHorizontal,
          opacity: disabled ? 0.45 : 1
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyles.text.color} />
      ) : (
        <>
          {icon}
          <Text style={[vStyles.text, { fontSize: sStyles.fontSize }, icon ? { marginLeft: 8 } : {}, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
