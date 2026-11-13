import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { triggerHapticSelection } from '../../utils/haptics';

export const RestTimerBanner: React.FC = () => {
  const {
    isRestTimerActive,
    restRemaining,
    restTotal,
    adjustRestTimer,
    stopRestTimer,
    pauseRestTimer,
    resumeRestTimer
  } = useWorkout();

  if (restRemaining <= 0 && !isRestTimerActive) {
    return null;
  }

  const mins = Math.floor(restRemaining / 60);
  const secs = restRemaining % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPct = restTotal > 0 ? (restRemaining / restTotal) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.timerInfo}>
          <View style={styles.pulseDot} />
          <Text style={styles.label}>REST TIMER</Text>
          <Text style={styles.timeText}>{formatted}</Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => {
              triggerHapticSelection();
              adjustRestTimer(-15);
            }}
          >
            <Text style={styles.adjustText}>-15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => {
              triggerHapticSelection();
              adjustRestTimer(15);
            }}
          >
            <Text style={styles.adjustText}>+15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={() => {
              triggerHapticSelection();
              if (isRestTimerActive) pauseRestTimer();
              else resumeRestTimer();
            }}
          >
            <Ionicons
              name={isRestTimerActive ? 'pause' : 'play'}
              size={16}
              color={THEME.colors.cyan}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              triggerHapticSelection();
              stopRestTimer();
            }}
          >
            <Ionicons name="close" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress line */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E1726',
    borderTopWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: THEME.colors.cyan,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.cyan,
    marginRight: 8
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.cyan,
    letterSpacing: 0.8,
    marginRight: 10
  },
  timeText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontVariant: ['tabular-nums']
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  adjustBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  adjustText: {
    color: THEME.colors.cyan,
    fontSize: 11,
    fontWeight: '700'
  },
  playPauseBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  skipBtn: {
    padding: 6
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.cyan
  }
});
