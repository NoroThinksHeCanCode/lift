import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../../types';
import { THEME } from '../../constants/theme';
import { getWorkoutsByMonth } from '../../db/database';
import { triggerHapticSelection } from '../../utils/haptics';

interface WorkoutCalendarProps {
  onSelectWorkout?: (workout: Workout) => void;
  unit?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WorkoutCalendarView: React.FC<WorkoutCalendarProps> = ({
  onSelectWorkout,
  unit = 'lbs'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthWorkouts, setMonthWorkouts] = useState<Record<string, Workout[]>>({});
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  const loadMonthData = async () => {
    const data = await getWorkoutsByMonth(year, month);
    setMonthWorkouts(data);
  };

  useEffect(() => {
    loadMonthData();
  }, [year, month]);

  const changeMonth = (delta: number) => {
    triggerHapticSelection();
    setCurrentDate(new Date(year, currentDate.getMonth() + delta, 1));
  };

  // Build calendar matrix
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const days: { dayNumber: number | null; dateKey: string | null }[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ dayNumber: null, dateKey: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNumber: d, dateKey: dStr });
  }

  const selectedWorkouts = monthWorkouts[selectedDateKey] || [];
  const monthTitle = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const totalWorkoutsThisMonth = Object.values(monthWorkouts).reduce((sum, list) => sum + list.length, 0);

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.navRow}>
        <View>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Text style={styles.monthSub}>{totalWorkoutsThisMonth} sessions completed</Text>
        </View>

        <View style={styles.navBtns}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navArrow}>
            <Ionicons name="chevron-back" size={20} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={20} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekdaysRow}>
        {DAYS_OF_WEEK.map((w, idx) => (
          <Text key={idx} style={styles.weekdayText}>
            {w}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {days.map((item, idx) => {
          if (!item.dayNumber || !item.dateKey) {
            return <View key={idx} style={styles.emptyDayCell} />;
          }

          const dayWorkouts = monthWorkouts[item.dateKey] || [];
          const hasWorkout = dayWorkouts.length > 0;
          const hasPR = dayWorkouts.some(w => w.sets?.some(s => s.is_pr));
          const isSelected = selectedDateKey === item.dateKey;
          const isToday = new Date().toISOString().split('T')[0] === item.dateKey;

          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              style={[
                styles.dayCell,
                hasPR && !isSelected && styles.dayCellPR,
                isSelected && (hasPR ? styles.dayCellSelectedPR : styles.dayCellSelected),
                isToday && !isSelected && !hasPR && styles.dayCellToday
              ]}
              onPress={() => {
                triggerHapticSelection();
                setSelectedDateKey(item.dateKey!);
              }}
            >
              <Text
                style={[
                  styles.dayNumText,
                  hasPR && !isSelected && styles.dayNumTextPR,
                  isSelected && styles.dayNumTextSelected,
                  isToday && !isSelected && !hasPR && styles.dayNumTextToday
                ]}
              >
                {item.dayNumber}
              </Text>

              {hasWorkout && (
                <View
                  style={[
                    styles.workoutDot,
                    hasPR && styles.workoutDotPR,
                    isSelected && styles.workoutDotSelected
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Calendar Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.primary }]} />
          <Text style={styles.legendText}>Workout</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.gold }]} />
          <Text style={[styles.legendText, { color: THEME.colors.gold }]}>PR Set 🏆</Text>
        </View>
      </View>

      {/* Selected Day Workout Details */}
      <View style={styles.detailsCard}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>
            {new Date(selectedDateKey + 'T12:00:00').toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.detailsCount}>
            {selectedWorkouts.length} workout{selectedWorkouts.length === 1 ? '' : 's'}
          </Text>
        </View>

        {selectedWorkouts.length === 0 ? (
          <Text style={styles.noWorkoutText}>Rest day. No workouts logged on this date.</Text>
        ) : (
          selectedWorkouts.map((w) => {
            const workoutHasPR = w.sets?.some(s => s.is_pr);
            return (
              <TouchableOpacity
                key={w.id}
                activeOpacity={0.8}
                onPress={() => onSelectWorkout && onSelectWorkout(w)}
                style={[styles.workoutItem, workoutHasPR && styles.workoutItemPR]}
              >
                <View style={[styles.workoutIndicator, workoutHasPR && styles.workoutIndicatorPR]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.workoutName}>{w.name}</Text>
                    {workoutHasPR && (
                      <View style={styles.prBadgeSmall}>
                        <Ionicons name="trophy" size={10} color={THEME.colors.gold} />
                        <Text style={styles.prBadgeSmallText}>PR</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.workoutMeta}>
                    {Math.floor(w.duration_seconds / 60)}m • {w.totalSets} sets • {w.totalVolume} {unit}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary
  },
  monthSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  navBtns: {
    flexDirection: 'row',
    gap: 8
  },
  navArrow: {
    backgroundColor: THEME.colors.surfaceElevated,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    width: 36,
    textAlign: 'center'
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 8
  },
  emptyDayCell: {
    width: 38,
    height: 38
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: THEME.colors.cyan
  },
  dayCellPR: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B'
  },
  dayCellSelected: {
    backgroundColor: THEME.colors.primary
  },
  dayCellSelectedPR: {
    backgroundColor: '#F59E0B'
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary
  },
  dayNumTextToday: {
    color: THEME.colors.cyan,
    fontWeight: '800'
  },
  dayNumTextPR: {
    color: '#F59E0B',
    fontWeight: '900'
  },
  dayNumTextSelected: {
    color: '#08090B',
    fontWeight: '900'
  },
  workoutDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary
  },
  workoutDotPR: {
    backgroundColor: '#F59E0B',
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  workoutDotSelected: {
    backgroundColor: '#08090B'
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#1C1C1C'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted
  },
  detailsCard: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary
  },
  detailsCount: {
    fontSize: 12,
    color: THEME.colors.textMuted
  },
  noWorkoutText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 6
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 10
  },
  workoutIndicator: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  workoutMeta: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2
  },
  workoutItemPR: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: '#14110A'
  },
  workoutIndicatorPR: {
    backgroundColor: THEME.colors.gold
  },
  prBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)'
  },
  prBadgeSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.gold
  }
});
