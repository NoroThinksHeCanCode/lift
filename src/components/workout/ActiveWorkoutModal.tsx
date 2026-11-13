import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, MachineVariant } from '../../types';
import { THEME } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { useSettings } from '../../context/SettingsContext';
import { SetRow } from './SetRow';
import { RestTimerBanner } from './RestTimerModal';
import { RestTimerPickerModal } from './RestTimerPickerModal';
import { RepRangePickerModal } from './RepRangePickerModal';
import { ProgressiveOverloadModal } from './ProgressiveOverloadModal';
import { MachineSelectorModal } from '../exercises/MachineSelectorModal';
import { ExerciseSelectorModal } from '../exercises/ExerciseSelectorModal';
import { PlateCalculatorModal } from '../plates/PlateCalculatorModal';
import { OneRepMaxModal } from '../calculator/OneRepMaxModal';
import { Badge } from '../common/Badge';
import { saveTemplate } from '../../db/database';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

export const ActiveWorkoutModal: React.FC = () => {
  const {
    isWorkoutModalVisible,
    setIsWorkoutModalVisible,
    activeWorkout,
    activeExercises,
    formattedWorkoutTime,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    setExerciseMachine,
    setExerciseCustomRest,
    setExerciseTargetRepRange,
    applyOverloadIncrease,
    addSet,
    removeSet,
    updateSet,
    toggleSetCompleted,
    finishWorkout,
    cancelWorkout,
    startRestTimer,
    currentOverloadPrompt,
    dismissOverloadPrompt
  } = useWorkout();

  const { settings } = useSettings();

  const [workoutName, setWorkoutName] = useState(activeWorkout?.name || 'Workout');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [show1RMCalculator, setShow1RMCalculator] = useState(false);
  const [notes, setNotes] = useState('');

  // Machine selector modal state
  const [machineModalTarget, setMachineModalTarget] = useState<{
    exerciseId: string;
    exerciseName: string;
    currentMachine?: MachineVariant;
    machines: MachineVariant[];
  } | null>(null);

  // Custom rest timer picker modal state
  const [restPickerTarget, setRestPickerTarget] = useState<{
    exerciseId?: string;
    exerciseName?: string;
    duration: number;
  } | null>(null);

  // Target rep range picker modal state (Feature 1)
  const [repRangeTarget, setRepRangeTarget] = useState<{
    exerciseId: string;
    exerciseName: string;
    min: number;
    max: number;
  } | null>(null);

  if (!activeWorkout) return null;

  const handleFinish = () => {
    triggerHapticSelection();
    Alert.alert(
      'Finish Workout',
      `Ready to finish "${workoutName}"? Duration: ${formattedWorkoutTime}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save Routine & Finish',
          onPress: async () => {
            const templateExercises = activeExercises.map(ex => ({
              exerciseId: ex.exercise.id,
              targetSets: ex.sets.length,
              machineId: ex.selectedMachine?.id
            }));
            await saveTemplate(workoutName, 'Saved from workout', templateExercises);
            await finishWorkout(notes);
            triggerHapticSuccess();
          }
        },
        {
          text: 'Finish Workout',
          style: 'default',
          onPress: async () => {
            await finishWorkout(notes);
            triggerHapticSuccess();
          }
        }
      ]
    );
  };

  const handleDiscard = () => {
    triggerHapticSelection();
    Alert.alert(
      'Discard Workout?',
      'All logged sets in this active session will be discarded.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => cancelWorkout()
        }
      ]
    );
  };

  return (
    <Modal
      visible={isWorkoutModalVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setIsWorkoutModalVisible(false)}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              triggerHapticSelection();
              setIsWorkoutModalVisible(false);
            }}
          >
            <Ionicons name="chevron-down" size={24} color={THEME.colors.textPrimary} />
          </TouchableOpacity>

          {/* Minimalist Live Timer */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRestPickerTarget({ duration: settings.defaultRestSeconds })}
            style={styles.timerCenter}
          >
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{formattedWorkoutTime}</Text>
          </TouchableOpacity>

          {/* Tools & Finish */}
          <View style={styles.headerRightRow}>
            <TouchableOpacity
              style={styles.toolIconBtn}
              onPress={() => {
                triggerHapticSelection();
                setShowPlateCalculator(true);
              }}
            >
              <Ionicons name="disc-outline" size={19} color={THEME.colors.cyan} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolIconBtn}
              onPress={() => {
                triggerHapticSelection();
                setShow1RMCalculator(true);
              }}
            >
              <Ionicons name="calculator-outline" size={19} color={THEME.colors.gold} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
              <Text style={styles.finishBtnText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <TextInput
            style={styles.titleInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Workout Title..."
            placeholderTextColor={THEME.colors.textMuted}
          />

          {/* Exercises */}
          {activeExercises.map((exSession) => {
            const { exercise, sets, previousSets, selectedMachine, customRestSeconds } = exSession;
            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exHeader}>
                  <View style={styles.exHeaderLeft}>
                    <Text style={styles.exName}>{exercise.name}</Text>

                    <View style={styles.subMetaRow}>
                      <Badge label={exercise.muscle_group} variant="primary" size="sm" />

                      {/* Machine selector pill (Feature 4) */}
                      {(exercise.equipment === 'Machine' || exercise.equipment === 'Cable' || (exercise.machines && exercise.machines.length > 0)) && (
                        <TouchableOpacity
                          style={styles.machinePill}
                          onPress={() => {
                            triggerHapticSelection();
                            setMachineModalTarget({
                              exerciseId: exercise.id,
                              exerciseName: exercise.name,
                              currentMachine: selectedMachine,
                              machines: exercise.machines || []
                            });
                          }}
                        >
                          <Ionicons name="hardware-chip" size={11} color={THEME.colors.cyan} />
                          <Text style={styles.machinePillText} numberOfLines={1}>
                            {selectedMachine ? selectedMachine.name : 'Choose Machine'}
                          </Text>
                          <Ionicons name="chevron-down" size={10} color={THEME.colors.cyan} />
                        </TouchableOpacity>
                      )}

                      {/* Target Rep Range Pill (Feature 1: Progressive Overload) */}
                      <TouchableOpacity
                        style={styles.repRangePill}
                        onPress={() => {
                          triggerHapticSelection();
                          setRepRangeTarget({
                            exerciseId: exercise.id,
                            exerciseName: exercise.name,
                            min: exSession.targetRepsMin,
                            max: exSession.targetRepsMax
                          });
                        }}
                      >
                        <Ionicons name="flag-outline" size={11} color={THEME.colors.primary} />
                        <Text style={styles.repRangePillText}>
                          {exSession.targetRepsMin}–{exSession.targetRepsMax} reps
                        </Text>
                      </TouchableOpacity>

                      {/* Custom Rest Timer button for this exercise (Feature 3) */}
                      <TouchableOpacity
                        style={styles.restPill}
                        onPress={() => {
                          triggerHapticSelection();
                          setRestPickerTarget({
                            exerciseId: exercise.id,
                            exerciseName: exercise.name,
                            duration: customRestSeconds || settings.defaultRestSeconds
                          });
                        }}
                      >
                        <Ionicons name="timer-outline" size={11} color={THEME.colors.textMuted} />
                        <Text style={styles.restPillText}>
                          {customRestSeconds ? `${customRestSeconds}s rest` : `${settings.defaultRestSeconds}s`}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Saved seat setting reminder */}
                    {selectedMachine?.seat_setting ? (
                      <Text style={styles.seatSettingNotice}>
                        Setting: {selectedMachine.seat_setting}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      triggerHapticSelection();
                      Alert.alert(
                        'Remove Exercise',
                        `Remove ${exercise.name} from this session?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => removeExerciseFromWorkout(exercise.id)
                          }
                        ]
                      );
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={THEME.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Table Header */}
                <View style={styles.tableHead}>
                  <Text style={[styles.thText, { width: 34 }]}>SET</Text>
                  <Text style={[styles.thText, { width: 58, textAlign: 'center' }]}>PREV</Text>
                  <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>
                    {settings.unit.toUpperCase()}
                  </Text>
                  <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                  <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>
                    {settings.rpeScale}
                  </Text>
                  <Text style={[styles.thText, { width: 34, textAlign: 'center' }]}>LOG</Text>
                  <View style={{ width: 18 }} />
                </View>

                {/* Sets */}
                {sets.map((set, idx) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    previousInfo={previousSets ? previousSets[idx] : undefined}
                    onUpdate={(updates) => updateSet(exercise.id, set.id, updates)}
                    onToggleComplete={() => toggleSetCompleted(exercise.id, set.id)}
                    onDelete={() => removeSet(exercise.id, set.id)}
                  />
                ))}

                {/* Add Set Button */}
                <TouchableOpacity
                  style={styles.addSetBtn}
                  onPress={() => {
                    triggerHapticSelection();
                    addSet(exercise.id);
                  }}
                >
                  <Ionicons name="add" size={15} color={THEME.colors.primary} />
                  <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add Exercise */}
          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => {
              triggerHapticSelection();
              setShowExerciseSelector(true);
            }}
          >
            <Ionicons name="add" size={18} color={THEME.colors.primary} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>

          {/* Workout Notes */}
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>SESSION NOTES</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Felt strong, pre-workout, warm-up notes..."
              placeholderTextColor={THEME.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Discard */}
          <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
            <Ionicons name="trash-outline" size={14} color={THEME.colors.danger} />
            <Text style={styles.discardText}>Discard Workout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Docked Rest Timer */}
        <RestTimerBanner />

        {/* Machine Selector Modal (Feature 4) */}
        {machineModalTarget && (
          <MachineSelectorModal
            visible={true}
            exerciseId={machineModalTarget.exerciseId}
            exerciseName={machineModalTarget.exerciseName}
            currentMachine={machineModalTarget.currentMachine}
            availableMachines={machineModalTarget.machines}
            onClose={() => setMachineModalTarget(null)}
            onSelectMachine={(m) => setExerciseMachine(machineModalTarget.exerciseId, m)}
            onMachineAdded={(newM) => {
              setMachineModalTarget(prev =>
                prev ? { ...prev, machines: [...prev.machines, newM] } : null
              );
            }}
          />
        )}

        {/* Custom Rest Timer Picker Modal (Feature 3) */}
        {restPickerTarget && (
          <RestTimerPickerModal
            visible={true}
            exerciseName={restPickerTarget.exerciseName}
            currentDurationSeconds={restPickerTarget.duration}
            onClose={() => setRestPickerTarget(null)}
            onSelectDuration={(secs, saveAsDefault) => {
              if (restPickerTarget.exerciseId && saveAsDefault) {
                setExerciseCustomRest(restPickerTarget.exerciseId, secs);
              }
              startRestTimer(secs);
            }}
          />
        )}

        {/* Target Rep Range Picker Modal (Feature 1: Progressive Overload) */}
        {repRangeTarget && (
          <RepRangePickerModal
            visible={true}
            exerciseName={repRangeTarget.exerciseName}
            initialMin={repRangeTarget.min}
            initialMax={repRangeTarget.max}
            onClose={() => setRepRangeTarget(null)}
            onSave={(min, max) => {
              setExerciseTargetRepRange(repRangeTarget.exerciseId, min, max);
            }}
          />
        )}

        {/* Progressive Overload Prompt Modal (Feature 1) */}
        <ProgressiveOverloadModal
          prompt={currentOverloadPrompt}
          onDismiss={dismissOverloadPrompt}
          onApplyIncrease={(newWeight) => {
            if (currentOverloadPrompt) {
              applyOverloadIncrease(currentOverloadPrompt.exerciseId, newWeight);
            }
          }}
        />

        {/* Exercise Selector */}
        <ExerciseSelectorModal
          visible={showExerciseSelector}
          onClose={() => setShowExerciseSelector(false)}
          onSelect={(ex) => addExerciseToWorkout(ex)}
        />

        {/* Plate Calculator */}
        <PlateCalculatorModal
          visible={showPlateCalculator}
          onClose={() => setShowPlateCalculator(false)}
        />

        {/* 1RM Calculator */}
        <OneRepMaxModal
          visible={show1RMCalculator}
          onClose={() => setShow1RMCalculator(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface
  },
  headerIconBtn: {
    padding: 6
  },
  timerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 6
  },
  timerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary
  },
  timerText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums']
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  toolIconBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceHighlight
  },
  finishBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8
  },
  finishBtnText: {
    color: '#08090B',
    fontWeight: '800',
    fontSize: 13
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 2
  },
  exerciseCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  exHeaderLeft: {
    flex: 1,
    gap: 6
  },
  exName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  repRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.colors.primary
  },
  repRangePillText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '700'
  },
  machinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  machinePillText: {
    fontSize: 11,
    color: THEME.colors.cyan,
    fontWeight: '700',
    maxWidth: 140
  },
  restPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4
  },
  restPillText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600'
  },
  seatSettingNotice: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '600'
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 6
  },
  thText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceHighlight,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6
  },
  addSetText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  addExerciseText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6
  },
  notesCard: {
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4
  },
  notesInput: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    minHeight: 40,
    textAlignVertical: 'top'
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  discardText: {
    color: THEME.colors.danger,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 6
  }
});
