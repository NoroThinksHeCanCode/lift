import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { OverloadPrompt } from '../../types';
import { triggerHapticSuccess, triggerHapticSelection } from '../../utils/haptics';

interface ProgressiveOverloadModalProps {
  prompt: OverloadPrompt | null;
  onDismiss: () => void;
  onApplyIncrease: (newWeight: number) => void;
}

export const ProgressiveOverloadModal: React.FC<ProgressiveOverloadModalProps> = ({
  prompt,
  onDismiss,
  onApplyIncrease
}) => {
  if (!prompt) return null;

  const handleApply = () => {
    triggerHapticSuccess();
    onApplyIncrease(prompt.recommendedWeight);
    onDismiss();
  };

  const handleDismiss = () => {
    triggerHapticSelection();
    onDismiss();
  };

  const delta = Math.round((prompt.recommendedWeight - prompt.currentWeight) * 10) / 10;

  return (
    <Modal visible={true} transparent={true} animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Target Icon */}
          <View style={styles.targetIconWrap}>
            <Ionicons name="trending-up" size={32} color={THEME.colors.primary} />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>PROGRESSIVE OVERLOAD</Text>
          </View>

          <h3 style={styles.title as any}>Top of Rep Range Hit!</h3>

          <Text style={styles.description}>
            You logged <Text style={styles.highlight}>{prompt.repsAchieved} reps</Text> on{' '}
            <Text style={styles.highlight}>{prompt.exerciseName}</Text> at {prompt.currentWeight} {prompt.unit} (Target: {prompt.targetMaxReps} reps).
          </Text>

          {/* Recommended Next Load Box */}
          <View style={styles.recommendBox}>
            <Text style={styles.recommendLabel}>RECOMMENDED NEXT LOAD</Text>
            <View style={styles.weightRow}>
              <Text style={styles.newWeight}>{prompt.recommendedWeight}</Text>
              <Text style={styles.unitText}>{prompt.unit}</Text>
              <View style={styles.deltaPill}>
                <Text style={styles.deltaText}>+{delta} {prompt.unit}</Text>
              </View>
            </View>
            <Text style={styles.recommendSub}>
              Double progression rule: you earned the right to step up the weight!
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnCol}>
            <TouchableOpacity activeOpacity={0.8} style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>INCREASE LOAD TO {prompt.recommendedWeight} {prompt.unit.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} style={styles.stayBtn} onPress={handleDismiss}>
              <Text style={styles.stayBtnText}>Keep Current Weight</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.xl,
    padding: 22,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    gap: 12
  },
  targetIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badge: {
    backgroundColor: THEME.colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.primary
  },
  badgeText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    textAlign: 'center'
  },
  description: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },
  highlight: {
    color: THEME.colors.textPrimary,
    fontWeight: '700'
  },
  recommendBox: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    gap: 4
  },
  recommendLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  newWeight: {
    fontSize: 34,
    fontWeight: '900',
    color: THEME.colors.primary,
    fontVariant: ['tabular-nums']
  },
  unitText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textSecondary
  },
  deltaPill: {
    backgroundColor: THEME.colors.primaryGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  recommendSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 2
  },
  btnCol: {
    width: '100%',
    gap: 8,
    marginTop: 4
  },
  applyBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 13,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center'
  },
  applyBtnText: {
    color: '#08090B',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5
  },
  stayBtn: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  stayBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '600'
  }
});
