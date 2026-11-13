import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { triggerHapticSelection } from '../../utils/haptics';

export const ActiveWorkoutBar: React.FC = () => {
  const {
    isWorkoutActive,
    activeWorkout,
    activeExercises,
    formattedWorkoutTime,
    setIsWorkoutModalVisible
  } = useWorkout();

  if (!isWorkoutActive || !activeWorkout) return null;

  const totalCompletedSets = activeExercises.reduce((sum, ex) => {
    return sum + ex.sets.filter(s => s.is_completed).length;
  }, 0);

  const totalSets = activeExercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const handlePress = () => {
    triggerHapticSelection();
    setIsWorkoutModalVisible(true);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.container} onPress={handlePress}>
      <View style={styles.leftInfo}>
        <View style={styles.indicatorPulse} />
        <View>
          <Text style={styles.workoutName} numberOfLines={1}>
            {activeWorkout.name}
          </Text>
          <Text style={styles.setsInfo}>
            {totalCompletedSets} / {totalSets} sets done
          </Text>
        </View>
      </View>

      <View style={styles.rightInfo}>
        <Ionicons name="time-outline" size={16} color={THEME.colors.primary} />
        <Text style={styles.timeText}>{formattedWorkoutTime}</Text>
        <Ionicons name="chevron-up" size={18} color={THEME.colors.textMuted} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 58, // Above tab bar
    left: 12,
    right: 12,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  indicatorPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.primary,
    marginRight: 12
  },
  workoutName: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  setsInfo: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  timeText: {
    color: THEME.colors.primary,
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 6,
    fontVariant: ['tabular-nums']
  },
  chevron: {
    marginLeft: 6
  }
});
