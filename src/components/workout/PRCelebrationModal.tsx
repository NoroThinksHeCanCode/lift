import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { triggerHapticSelection } from '../../utils/haptics';

export const PRCelebrationModal: React.FC = () => {
  const { currentPRNotification, dismissPRNotification } = useWorkout();

  if (!currentPRNotification) return null;

  const getPRTitle = () => {
    switch (currentPRNotification.type) {
      case 'weight':
        return 'HEAVIEST WEIGHT PR!';
      case '1rm':
        return 'ESTIMATED 1RM PR!';
      case 'reps':
        return 'REP RECORD PR!';
    }
  };

  const getPRUnit = () => {
    if (currentPRNotification.type === 'reps') return 'reps';
    return currentPRNotification.unit;
  };

  const diff = currentPRNotification.previousValue > 0
    ? Math.round((currentPRNotification.value - currentPRNotification.previousValue) * 10) / 10
    : null;

  const handleDismiss = () => {
    triggerHapticSelection();
    dismissPRNotification();
  };

  return (
    <Modal visible={true} transparent={true} animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Glowing Trophy Icon */}
          <View style={styles.trophyWrapper}>
            <View style={styles.trophyGlow} />
            <Ionicons name="trophy" size={54} color={THEME.colors.gold} />
          </View>

          {/* Banner Tag */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getPRTitle()}</Text>
          </View>

          {/* Exercise Name */}
          <Text style={styles.exerciseName}>{currentPRNotification.exerciseName}</Text>

          {/* New Record Big Numbers */}
          <View style={styles.recordRow}>
            <Text style={styles.recordValue}>{currentPRNotification.value}</Text>
            <Text style={styles.recordUnit}>{getPRUnit()}</Text>
          </View>

          {/* Previous record comparison */}
          {diff && diff > 0 ? (
            <View style={styles.diffBox}>
              <Ionicons name="trending-up" size={16} color={THEME.colors.primary} />
              <Text style={styles.diffText}>
                +{diff} {getPRUnit()} over previous ({currentPRNotification.previousValue} {getPRUnit()})
              </Text>
            </View>
          ) : (
            <View style={styles.diffBox}>
              <Ionicons name="flame" size={16} color={THEME.colors.gold} />
              <Text style={styles.diffText}>New personal milestone set!</Text>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity activeOpacity={0.8} style={styles.actionBtn} onPress={handleDismiss}>
            <Text style={styles.actionBtnText}>LET'S GO!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.gold,
    shadowColor: THEME.colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12
  },
  trophyWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: THEME.colors.goldGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  trophyGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(245, 158, 11, 0.15)'
  },
  badge: {
    backgroundColor: THEME.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    marginBottom: 10
  },
  badgeText: {
    color: '#0A0C10',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14
  },
  recordValue: {
    fontSize: 48,
    fontWeight: '900',
    color: THEME.colors.gold,
    letterSpacing: -1
  },
  recordUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginLeft: 8
  },
  diffBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceHighlight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 20
  },
  diffText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6
  },
  actionBtn: {
    width: '100%',
    backgroundColor: THEME.colors.gold,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.lg,
    alignItems: 'center',
    shadowColor: THEME.colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4
  },
  actionBtnText: {
    color: '#0A0C10',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8
  }
});
