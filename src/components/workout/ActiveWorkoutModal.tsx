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
import { ExerciseNoteModal } from './ExerciseNoteModal';
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
    setExerciseTargetRepRange,
    setExerciseNotes,
    workoutRestSeconds,
    setWorkoutRestSeconds,
    workoutRepRange,
    isWorkoutRepRangeLocked,
    setWorkoutRepRange,
    toggleWorkoutRepRange,
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

  // Machine selector modal state
  const [machineModalTarget, setMachineModalTarget] = useState<{
    exerciseId: string;
    exerciseName: string;
    currentMachine?: MachineVariant;
    machines: MachineVariant[];
  } | null>(null);

  // Workout-wide rest timer picker modal state
  const [showRestPicker, setShowRestPicker] = useState(false);

  // Target rep range picker modal state
  const [repRangeTarget, setRepRangeTarget] = useState<{
    exerciseId?: string;
    exerciseName?: string;
    min: number;
    max: number;
  } | null>(null);

  // Exercise note modal state
  const [exerciseNoteTarget, setExerciseNoteTarget] = useState<{
    exerciseId: string;
    exerciseName: string;
    note: string;
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
            await saveTemplate(workoutName, 'Saved routine', templateExercises);
            await finishWorkout();
            triggerHapticSuccess();
          }
        },
        {
          text: 'Finish Workout',
          style: 'default',
          onPress: async () => {
            await finishWorkout();
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
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Minimalist Live Timer */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowRestPicker(true)}
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

        {/* Workout-Wide Settings Toolbar (Rest & Rep Range) */}
        <View style={styles.workoutToolbar}>
          {/* Workout Rest Timer setting */}
          <TouchableOpacity
            style={styles.toolbarPill}
            onPress={() => {
              triggerHapticSelection();
              setShowRestPicker(true);
            }}
          >
            <Ionicons name="timer-outline" size={13} color={THEME.colors.cyan} />
            <Text style={styles.toolbarPillText}>Rest: {workoutRestSeconds}s</Text>
            <Ionicons name="chevron-down" size={10} color={THEME.colors.cyan} />
          </TouchableOpacity>

          {/* Workout Rep Range toggle menu */}
          <TouchableOpacity
            style={[styles.toolbarPill, isWorkoutRepRangeLocked && styles.toolbarPillActive]}
            onPress={() => {
              triggerHapticSelection();
              setRepRangeTarget({
                exerciseName: 'Entire Workout Rep Range',
                min: workoutRepRange.min,
                max: workoutRepRange.max
              });
            }}
          >
            <Ionicons name="flag-outline" size={13} color={THEME.colors.primary} />
            <Text style={[styles.toolbarPillText, isWorkoutRepRangeLocked && { color: THEME.colors.primary }]}>
              Target: {workoutRepRange.min}–{workoutRepRange.max} reps
            </Text>
            <Ionicons name="chevron-down" size={10} color={THEME.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <TextInput
            style={styles.titleInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Workout Title..."
            placeholderTextColor="#737373"
          />

          {/* Exercises */}
          {activeExercises.map((exSession) => {
            const { exercise, sets, previousSets, selectedMachine, notes: exNotes } = exSession;
            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exHeader}>
                  <View style={styles.exHeaderLeft}>
                    <Text style={styles.exName}>{exercise.name}</Text>

                    <View style={styles.subMetaRow}>
                      <Badge label={exercise.muscle_group} variant="primary" size="sm" />

                      {/* Joint Action Tag (Anatomical Classification) */}
                      {exercise.joint_action ? (
                        <View style={styles.jointActionBadge}>
                          <Ionicons name="body-outline" size={10} color="#06B6D4" />
                          <Text style={styles.jointActionText}>{exercise.joint_action}</Text>
                        </View>
                      ) : null}

                      {/* Machine selector pill */}
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

                      {/* Target Rep Range Pill */}
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

                      {/* Exercise Note Button */}
                      <TouchableOpacity
                        style={[styles.noteBtn, exNotes ? styles.noteBtnActive : null]}
                        onPress={() => {
                          triggerHapticSelection();
                          setExerciseNoteTarget({
                            exerciseId: exercise.id,
                            exerciseName: exercise.name,
                            note: exNotes || ''
                          });
                        }}
                      >
                        <Ionicons name="document-text-outline" size={11} color={exNotes ? THEME.colors.primary : '#737373'} />
                        <Text style={[styles.noteBtnText, exNotes ? { color: THEME.colors.primary } : null]}>
                          {exNotes ? 'Note' : '+ Note'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Exercise Note Preview Card */}
                    {exNotes ? (
                      <TouchableOpacity
                        style={styles.exerciseNotePreview}
                        onPress={() => {
                          triggerHapticSelection();
                          setExerciseNoteTarget({
                            exerciseId: exercise.id,
                            exerciseName: exercise.name,
                            note: exNotes
                          });
                        }}
                      >
                        <Ionicons name="create-outline" size={12} color="#737373" />
                        <Text style={styles.exerciseNotePreviewText} numberOfLines={2}>
                          {exNotes}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

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
                    <Ionicons name="ellipsis-horizontal" size={18} color="#737373" />
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

          {/* Discard */}
          <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
            <Ionicons name="trash-outline" size={14} color={THEME.colors.danger} />
            <Text style={styles.discardText}>Discard Workout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Docked Rest Timer */}
        <RestTimerBanner />

        {/* Machine Selector Modal */}
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

        {/* Workout-Wide Rest Timer Picker Modal */}
        {showRestPicker && (
          <RestTimerPickerModal
            visible={true}
            exerciseName="Workout Rest Timer"
            currentDurationSeconds={workoutRestSeconds}
            onClose={() => setShowRestPicker(false)}
            onSelectDuration={(secs) => {
              setWorkoutRestSeconds(secs);
              startRestTimer(secs);
            }}
          />
        )}

        {/* Target Rep Range Picker Modal */}
        {repRangeTarget && (
          <RepRangePickerModal
            visible={true}
            exerciseName={repRangeTarget.exerciseName}
            initialMin={repRangeTarget.min}
            initialMax={repRangeTarget.max}
            allowWorkoutWideToggle={true}
            onClose={() => setRepRangeTarget(null)}
            onSave={(min, max, applyToAll) => {
              if (repRangeTarget.exerciseId) {
                setExerciseTargetRepRange(repRangeTarget.exerciseId, min, max, applyToAll);
              } else {
                setWorkoutRepRange(min, max, applyToAll);
              }
            }}
          />
        )}

        {/* Exercise Note Modal */}
        {exerciseNoteTarget && (
          <ExerciseNoteModal
            visible={true}
            exerciseName={exerciseNoteTarget.exerciseName}
            initialNote={exerciseNoteTarget.note}
            onClose={() => setExerciseNoteTarget(null)}
            onSave={(savedNote) => {
              setExerciseNotes(exerciseNoteTarget.exerciseId, savedNote);
            }}
          />
        )}

        {/* Progressive Overload Prompt Modal */}
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
    backgroundColor: '#000000'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#000000'
  },
  headerIconBtn: {
    padding: 6,
    marginRight: 4
  },
  timerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262626'
  },
  timerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
    marginRight: 6
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums']
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  toolIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626'
  },
  finishBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8
  },
  finishBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13
  },
  workoutToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderColor: '#1C1C1C'
  },
  toolbarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#121212',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626'
  },
  toolbarPillActive: {
    borderColor: `${THEME.colors.primary}50`
  },
  toolbarPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A8A8'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingVertical: 4,
    marginBottom: 16
  },
  exerciseCard: {
    backgroundColor: '#000000',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626'
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  exHeaderLeft: {
    flex: 1,
    marginRight: 8
  },
  exName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  jointActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)'
  },
  jointActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06B6D4'
  },
  machinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#121212',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#262626'
  },
  machinePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#06B6D4',
    maxWidth: 130
  },
  repRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${THEME.colors.primary}15`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${THEME.colors.primary}40`
  },
  repRangePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  noteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#121212',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#262626'
  },
  noteBtnActive: {
    backgroundColor: `${THEME.colors.primary}15`,
    borderColor: `${THEME.colors.primary}40`
  },
  noteBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#737373'
  },
  exerciseNotePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#121212',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626',
    marginTop: 8
  },
  exerciseNotePreviewText: {
    fontSize: 11,
    color: '#A8A8A8',
    flex: 1,
    lineHeight: 15
  },
  seatSettingNotice: {
    fontSize: 10,
    color: '#737373',
    marginTop: 4,
    fontStyle: 'italic'
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#1C1C1C',
    marginBottom: 4
  },
  thText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737373',
    letterSpacing: 0.5
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#121212',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#262626'
  },
  addSetText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#121212',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 20
  },
  addExerciseText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10
  },
  discardText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.danger
  }
});
