import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../types';
import { THEME } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useWorkout } from '../context/WorkoutContext';
import { deleteWorkout, getAllExercises, getWeeklyVolumeData, getWorkoutHistory } from '../db/database';
import { VolumeBarChart } from '../components/charts/VolumeBarChart';
import { WorkoutCalendarView } from '../components/history/WorkoutCalendarView';
import { Badge } from '../components/common/Badge';
import { triggerHapticSelection } from '../utils/haptics';

export const HistoryScreen: React.FC = () => {
  const { settings } = useSettings();
  const { isWorkoutActive } = useWorkout();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ weekLabel: string; totalVolume: number; workoutsCount: number }[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, string>>({});
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [history, weekly, exList] = await Promise.all([
        getWorkoutHistory(30),
        getWeeklyVolumeData(),
        getAllExercises()
      ]);

      const map: Record<string, string> = {};
      exList.forEach(e => {
        map[e.id] = e.name;
      });

      setWorkouts(history);
      setWeeklyData(weekly);
      setExerciseMap(map);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, isWorkoutActive]);

  const handleDelete = (id: string, name: string) => {
    triggerHapticSelection();
    Alert.alert(
      'Delete Workout Record',
      `Delete "${name}" from your history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(id);
            await loadData();
          }
        }
      ]
    );
  };

  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalAllVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>LIFETIME METRICS</Text>
          <Text style={styles.headerTitle}>Workout Log & Analytics</Text>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => {
              triggerHapticSelection();
              setViewMode('list');
            }}
          >
            <Ionicons
              name="list"
              size={16}
              color={viewMode === 'list' ? '#08090B' : THEME.colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
            onPress={() => {
              triggerHapticSelection();
              setViewMode('calendar');
            }}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={viewMode === 'calendar' ? '#08090B' : THEME.colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {viewMode === 'calendar' ? (
          <WorkoutCalendarView unit={settings.unit} />
        ) : (
          <>
            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{workouts.length}</Text>
                <Text style={styles.statLabel}>WORKOUTS LOGGED</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {totalAllVolume > 9999 ? `${(totalAllVolume / 1000).toFixed(1)}k` : totalAllVolume}
                </Text>
                <Text style={styles.statLabel}>TOTAL {settings.unit.toUpperCase()} TONNAGE</Text>
              </View>
            </View>

            {/* Weekly Volume Bar Chart */}
            <VolumeBarChart data={weeklyData} unit={settings.unit} />

            {/* Workout History List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>WORKOUT LOG</Text>
              <TouchableOpacity onPress={loadData} style={{ padding: 4 }}>
                <Ionicons name="refresh" size={16} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={THEME.colors.primary} style={{ marginTop: 20 }} />
            ) : workouts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="barbell-outline" size={44} color={THEME.colors.textMuted} />
                <Text style={styles.emptyTitle}>No workouts completed yet</Text>
                <Text style={styles.emptySub}>Start your first session from the Workouts tab!</Text>
              </View>
            ) : (
              workouts.map((w) => {
                const isExpanded = expandedWorkoutId === w.id;

                const groupedSets: Record<string, typeof w.sets> = {};
                (w.sets || []).forEach(s => {
                  if (!groupedSets[s.exercise_id]) groupedSets[s.exercise_id] = [];
                  groupedSets[s.exercise_id]?.push(s);
                });

                return (
                  <View key={w.id} style={styles.workoutCard}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        triggerHapticSelection();
                        setExpandedWorkoutId(isExpanded ? null : w.id);
                      }}
                      style={styles.cardHeader}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.workoutName}>{w.name}</Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaText}>{formatDate(w.start_time)}</Text>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.metaText}>{formatDuration(w.duration_seconds)}</Text>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.metaText}>{w.totalSets} sets</Text>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={[styles.metaText, { color: THEME.colors.primary }]}>
                            {w.totalVolume} {settings.unit}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardRightActions}>
                        <TouchableOpacity
                          onPress={() => handleDelete(w.id, w.name)}
                          style={styles.trashBtn}
                        >
                          <Ionicons name="trash-outline" size={16} color={THEME.colors.textMuted} />
                        </TouchableOpacity>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={THEME.colors.textMuted}
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.cardBody}>
                        {w.notes ? (
                          <View style={styles.notesBox}>
                            <Text style={styles.notesText}>"{w.notes}"</Text>
                          </View>
                        ) : null}

                        {Object.entries(groupedSets).map(([exId, setsList]) => {
                          const exName = exerciseMap[exId] || 'Exercise';
                          return (
                            <View key={exId} style={styles.exerciseDetailGroup}>
                              <Text style={styles.detailExName}>{exName}</Text>
                              <View style={styles.detailSetsGrid}>
                                {setsList?.map((s) => (
                                  <View key={s.id} style={styles.setDetailPill}>
                                    <Text style={styles.setPillText}>
                                      {s.weight} {settings.unit} × {s.reps}
                                    </Text>
                                    {s.machine_name ? (
                                      <Text style={styles.setMachineSub}> ({s.machine_name})</Text>
                                    ) : null}
                                    {s.is_pr && (
                                      <View style={styles.prBadgeSmall}>
                                        <Ionicons name="trophy" size={10} color={THEME.colors.gold} />
                                        <Text style={styles.prBadgeSmallText}>PR</Text>
                                      </View>
                                    )}
                                  </View>
                                ))}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.cyan,
    letterSpacing: 1.2
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginTop: 2
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.primary
  },
  setMachineSub: {
    fontSize: 11,
    color: THEME.colors.textMuted
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  statVal: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 4
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  emptySub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center'
  },
  workoutCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  metaText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500'
  },
  metaDot: {
    color: THEME.colors.textMuted,
    marginHorizontal: 6
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8
  },
  trashBtn: {
    padding: 4
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: THEME.colors.border,
    paddingTop: 12,
    gap: 12
  },
  notesBox: {
    backgroundColor: THEME.colors.surfaceElevated,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderColor: THEME.colors.primary
  },
  notesText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic'
  },
  exerciseDetailGroup: {
    gap: 6
  },
  detailExName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  detailSetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  setDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  setPillText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600'
  },
  prBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.goldGlow,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6
  },
  prBadgeSmallText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.gold,
    marginLeft: 2
  }
});
