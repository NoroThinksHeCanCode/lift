import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { useSettings } from '../../context/SettingsContext';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

export const WorkoutSummaryModal: React.FC = () => {
  const { completedWorkoutSummary, dismissWorkoutSummary } = useWorkout();
  const { settings } = useSettings();

  useEffect(() => {
    if (completedWorkoutSummary) {
      triggerHapticSuccess();
    }
  }, [completedWorkoutSummary]);

  if (!completedWorkoutSummary) return null;

  const {
    workoutName,
    formattedDuration,
    totalVolume,
    completedSetsCount,
    prs,
    exercises
  } = completedWorkoutSummary;

  const handleDone = () => {
    triggerHapticSelection();
    dismissWorkoutSummary();
  };

  const getPRLabel = (type: string) => {
    switch (type) {
      case 'weight':
        return 'HEAVIEST WEIGHT';
      case '1rm':
        return 'EST. 1RM RECORD';
      case 'reps':
        return 'REP RECORD';
      default:
        return 'PERSONAL RECORD';
    }
  };

  return (
    <Modal visible={true} transparent={false} animationType="slide">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.trophyWrapper}>
              <View style={styles.trophyGlow} />
              <Ionicons name="trophy" size={38} color={THEME.colors.gold} />
            </View>
            <Text style={styles.eyebrowText}>L!FT COMPLETED</Text>
            <Text style={styles.workoutTitle} numberOfLines={1}>
              {workoutName || 'Workout'}
            </Text>
            <Text style={styles.dateSub}>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })} • Great work pushing your limits!
            </Text>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Stat Counters Grid */}
            <View style={styles.statsGrid}>
              {/* Duration */}
              <View style={styles.statCard}>
                <Ionicons name="timer-outline" size={20} color={THEME.colors.cyan} />
                <Text style={styles.statValue}>{formattedDuration}</Text>
                <Text style={styles.statLabel}>TIME</Text>
              </View>

              {/* Volume */}
              <View style={styles.statCard}>
                <Ionicons name="barbell-outline" size={20} color={THEME.colors.primary} />
                <Text style={styles.statValue}>
                  {totalVolume.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>VOLUME ({settings.unit.toUpperCase()})</Text>
              </View>

              {/* Sets */}
              <View style={styles.statCard}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#A855F7" />
                <Text style={styles.statValue}>{completedSetsCount}</Text>
                <Text style={styles.statLabel}>SETS LOGGED</Text>
              </View>

              {/* PRs */}
              <View style={[styles.statCard, prs.length > 0 && styles.statCardGold]}>
                <Ionicons name="trophy-outline" size={20} color={THEME.colors.gold} />
                <Text style={[styles.statValue, prs.length > 0 && { color: THEME.colors.gold }]}>
                  {prs.length}
                </Text>
                <Text style={[styles.statLabel, prs.length > 0 && { color: THEME.colors.gold }]}>
                  PRS SET
                </Text>
              </View>
            </View>

            {/* PR Highlights Section */}
            {prs.length > 0 && (
              <View style={styles.prSectionCard}>
                <View style={styles.prHeaderRow}>
                  <View style={styles.prBadgeIcon}>
                    <Ionicons name="flash" size={16} color={THEME.colors.gold} />
                  </View>
                  <Text style={styles.prSectionTitle}>PERSONAL RECORDS HIT</Text>
                </View>

                {prs.map((pr, idx) => (
                  <View key={idx} style={styles.prItemRow}>
                    <View style={styles.prItemLeft}>
                      <Text style={styles.prExerciseName}>{pr.exerciseName}</Text>
                      <View style={styles.prTypeBadge}>
                        <Text style={styles.prTypeBadgeText}>{getPRLabel(pr.type)}</Text>
                      </View>
                    </View>

                    <View style={styles.prItemRight}>
                      <Text style={styles.prScoreText}>
                        {pr.weight} {pr.unit} × {pr.reps}
                      </Text>
                      {pr.estimated1RM > 0 && (
                        <Text style={styles.prEstText}>
                          Est. 1RM: {pr.estimated1RM} {pr.unit}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Exercises Breakdown */}
            <View style={styles.exercisesCard}>
              <Text style={styles.sectionHeading}>EXERCISES PERFORMED</Text>
              {exercises.map((ex, idx) => (
                <View key={idx} style={styles.exerciseRow}>
                  <View style={styles.exerciseIndexBox}>
                    <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.exerciseNameText}>{ex.exerciseName}</Text>
                      {ex.hasPR && (
                        <View style={styles.prTagMini}>
                          <Ionicons name="trophy" size={9} color={THEME.colors.gold} />
                          <Text style={styles.prTagMiniText}>PR</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.exerciseMetaText}>
                      {ex.totalSets} set{ex.totalSets === 1 ? '' : 's'} • Best: {ex.bestSet.weight} {settings.unit} × {ex.bestSet.reps}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Done Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>DONE</Text>
              <Ionicons name="checkmark-circle" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000'
  },
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  header: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#1C1C1C'
  },
  trophyWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  trophyGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.08)'
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.gold,
    letterSpacing: 1.4,
    marginBottom: 4
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center'
  },
  dateSub: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4
  },
  statCardGold: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: '#17130A'
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 0.8
  },
  prSectionCard: {
    backgroundColor: '#14110A',
    borderWidth: 1.5,
    borderColor: THEME.colors.gold,
    borderRadius: 14,
    padding: 14,
    gap: 10
  },
  prHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  prBadgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  prSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.gold,
    letterSpacing: 1
  },
  prItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C160B',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  prItemLeft: {
    flex: 1,
    marginRight: 10
  },
  prExerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  prTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 3
  },
  prTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.gold,
    letterSpacing: 0.5
  },
  prItemRight: {
    alignItems: 'flex-end'
  },
  prScoreText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  prEstText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.cyan,
    marginTop: 2
  },
  exercisesCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 14,
    padding: 14,
    gap: 12
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 1
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  exerciseIndexBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E2E'
  },
  exerciseIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A8A8A8'
  },
  exerciseNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  exerciseMetaText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2
  },
  prTagMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  prTagMiniText: {
    fontSize: 9,
    fontWeight: '900',
    color: THEME.colors.gold
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#1C1C1C',
    backgroundColor: '#000000'
  },
  doneBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6
  },
  doneBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1
  }
});
