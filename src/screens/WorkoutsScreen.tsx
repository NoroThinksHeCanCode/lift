import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, Template } from '../types';
import { THEME } from '../constants/theme';
import { useWorkout } from '../context/WorkoutContext';
import { deleteTemplate, getAllTemplates, saveTemplate } from '../db/database';
import { ExerciseSelectorModal } from '../components/exercises/ExerciseSelectorModal';
import { Badge } from '../components/common/Badge';
import { NamePromptModal } from '../components/common/NamePromptModal';
import { useSettings } from '../context/SettingsContext';
import { triggerHapticSelection, triggerHapticSuccess } from '../utils/haptics';

export const WorkoutsScreen: React.FC = () => {
  const { isWorkoutActive, startWorkout, setIsWorkoutModalVisible } = useWorkout();
  const { settings, isLoaded, updateSettings } = useSettings();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = settings.userName ? `, ${settings.userName}` : '';
    if (hour >= 5 && hour < 12) return `Good Morning${name}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon${name}`;
    return `Good Evening${name}`;
  };

  interface RoutineExerciseItem {
    exercise: Exercise;
    target_sets: number;
    target_reps_min: number;
    target_reps_max: number;
  }

  // Template creation & editing state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateNotes, setTemplateNotes] = useState('');
  const [templateExercises, setTemplateExercises] = useState<RoutineExerciseItem[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const loadTemplates = async () => {
    const list = await getAllTemplates();
    setTemplates(list);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleStartEmpty = async () => {
    triggerHapticSelection();
    if (isWorkoutActive) {
      setIsWorkoutModalVisible(true);
      return;
    }
    await startWorkout();
  };

  const handleStartTemplate = async (template: Template) => {
    triggerHapticSelection();
    if (isWorkoutActive) {
      Alert.alert(
        'Workout in Progress',
        'You already have an active workout. Would you like to resume it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Resume Active', onPress: () => setIsWorkoutModalVisible(true) }
        ]
      );
      return;
    }
    await startWorkout(template.name, template.id, template.exercises);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    triggerHapticSelection();
    Alert.alert(
      'Delete Routine',
      `Delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(id);
            await loadTemplates();
          }
        }
      ]
    );
  };

  const handleOpenCreateModal = () => {
    triggerHapticSelection();
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateNotes('');
    setTemplateExercises([]);
    setShowCreateTemplateModal(true);
  };

  const handleOpenEditModal = (template: Template) => {
    triggerHapticSelection();
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateNotes(template.notes || '');
    setTemplateExercises(
      (template.exercises || []).map(te => ({
        exercise: te.exercise,
        target_sets: te.target_sets || 3,
        target_reps_min: te.target_reps_min ?? (settings.defaultRepRangeMin || 8),
        target_reps_max: te.target_reps_max ?? (settings.defaultRepRangeMax || 12)
      }))
    );
    setShowCreateTemplateModal(true);
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    triggerHapticSelection();
    setTemplateExercises(prev => {
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      Alert.alert('Required', 'Please enter a routine name.');
      return;
    }
    if (templateExercises.length === 0) {
      Alert.alert('Required', 'Add at least one exercise to this routine.');
      return;
    }

    await saveTemplate(
      templateName,
      templateNotes,
      templateExercises.map(te => ({
        exerciseId: te.exercise.id,
        targetSets: te.target_sets,
        targetRepsMin: te.target_reps_min,
        targetRepsMax: te.target_reps_max
      })),
      editingTemplateId || undefined
    );
    triggerHapticSuccess();
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateNotes('');
    setTemplateExercises([]);
    setShowCreateTemplateModal(false);
    await loadTemplates();
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>READY TO L!FT?</Text>
          <Text style={styles.headerTitle}>{getGreeting()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Start Card */}
        <View style={styles.quickStartCard}>
          <View style={styles.quickStartInfo}>
            <Text style={styles.quickStartTitle}>Quick Start</Text>
            <Text style={styles.quickStartSubtitle}>Start an empty workout and log on the fly</Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={handleStartEmpty}>
            <Ionicons name="play" size={18} color="#0A0C10" />
            <Text style={styles.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Templates Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MY ROUTINES & TEMPLATES</Text>
          <TouchableOpacity
            style={styles.newRoutineBtn}
            onPress={handleOpenCreateModal}
          >
            <Ionicons name="add" size={16} color={THEME.colors.primary} />
            <Text style={styles.newRoutineText}>New Routine</Text>
          </TouchableOpacity>
        </View>

        {/* Templates List */}
        <View style={styles.templatesList}>
          {templates.map((template) => (
            <View key={template.id} style={styles.templateCard}>
              <View style={styles.templateTopRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  {template.notes ? (
                    <Text style={styles.templateNotes}>{template.notes}</Text>
                  ) : null}
                </View>

                <View style={styles.cardHeaderActions}>
                  <TouchableOpacity
                    onPress={() => handleOpenEditModal(template)}
                    style={styles.editPencilBtn}
                  >
                    <Ionicons name="pencil" size={15} color={THEME.colors.cyan} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteTemplate(template.id, template.name)}
                    style={styles.trashBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={THEME.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Exercises in template preview */}
              <View style={styles.templateExPreview}>
                {template.exercises && template.exercises.length > 0 ? (
                  template.exercises.map((te, idx) => (
                    <Text key={idx} style={styles.previewExText} numberOfLines={1}>
                      • {te.exercise.name}{' '}
                      <Text style={styles.previewSetsText}>
                        ({te.target_sets} sets • {te.target_reps_min ?? 8}–{te.target_reps_max ?? 12} reps)
                      </Text>
                    </Text>
                  ))
                ) : (
                  <Text style={styles.emptyTemplateText}>No exercises added</Text>
                )}
              </View>

              {/* Action Buttons Row */}
              <View style={styles.cardBtnRow}>
                <TouchableOpacity
                  style={styles.editRoutineBtn}
                  onPress={() => handleOpenEditModal(template)}
                >
                  <Ionicons name="create-outline" size={15} color={THEME.colors.cyan} />
                  <Text style={styles.editRoutineText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.startRoutineBtn}
                  onPress={() => handleStartTemplate(template)}
                >
                  <Ionicons name="play" size={15} color={THEME.colors.primary} />
                  <Text style={styles.startRoutineText}>Start Routine</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Create / Edit Routine Modal */}
      <Modal
        visible={showCreateTemplateModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreateTemplateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCreateTemplateModal(false)}
              style={{ padding: 6 }}
            >
              <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {editingTemplateId ? 'Edit Routine' : 'Create Routine'}
            </Text>
            <TouchableOpacity onPress={handleSaveTemplate} style={styles.saveTemplateBtn}>
              <Text style={styles.saveTemplateBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Template Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ROUTINE NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Upper Power, Chest & Arms..."
                placeholderTextColor={THEME.colors.textMuted}
                value={templateName}
                onChangeText={setTemplateName}
              />
            </View>

            {/* Template Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DESCRIPTION / NOTES</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Target reps, focus points, rest guidelines..."
                placeholderTextColor={THEME.colors.textMuted}
                multiline
                value={templateNotes}
                onChangeText={setTemplateNotes}
              />
            </View>

            {/* Exercises List in Template */}
            <View style={styles.fieldGroup}>
              <View style={styles.subHeaderRow}>
                <Text style={styles.fieldLabel}>EXERCISES ({templateExercises.length})</Text>
                <TouchableOpacity
                  style={styles.addExChip}
                  onPress={() => {
                    triggerHapticSelection();
                    setShowExercisePicker(true);
                  }}
                >
                  <Ionicons name="add" size={16} color={THEME.colors.primary} />
                  <Text style={styles.addExChipText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {templateExercises.length === 0 ? (
                <View style={styles.emptyAddBox}>
                  <Text style={styles.emptyAddText}>No exercises added yet.</Text>
                </View>
              ) : (
                templateExercises.map((te, idx) => (
                  <View key={idx} style={styles.templateExCard}>
                    {/* Header Row: Reorder, Name, Muscle & Delete */}
                    <View style={styles.templateExCardHeader}>
                      <View style={styles.reorderBtnsGroup}>
                        <TouchableOpacity
                          disabled={idx === 0}
                          onPress={() => moveExercise(idx, 'up')}
                          style={[styles.reorderBtn, idx === 0 && { opacity: 0.25 }]}
                        >
                          <Ionicons name="chevron-up" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={idx === templateExercises.length - 1}
                          onPress={() => moveExercise(idx, 'down')}
                          style={[styles.reorderBtn, idx === templateExercises.length - 1 && { opacity: 0.25 }]}
                        >
                          <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.templateExName}>{te.exercise.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Badge label={te.exercise.muscle_group} variant="primary" size="sm" />
                          <Badge label={te.exercise.equipment} variant="cyan" size="sm" />
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          triggerHapticSelection();
                          setTemplateExercises(prev => prev.filter((_, i) => i !== idx));
                        }}
                        style={styles.deleteExBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color={THEME.colors.danger} />
                      </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Steppers: Sets & Reps */}
                    <View style={styles.templateExSteppersRow}>
                      {/* Sets */}
                      <View style={styles.stepperSubBlock}>
                        <Text style={styles.stepperSubBlockLabel}>SETS</Text>
                        <View style={styles.stepperControl}>
                          <TouchableOpacity
                            onPress={() => {
                              triggerHapticSelection();
                              setTemplateExercises(prev =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, target_sets: Math.max(1, item.target_sets - 1) } : item
                                )
                              );
                            }}
                            style={styles.miniStepBtn}
                          >
                            <Ionicons name="remove" size={13} color="#FFFFFF" />
                          </TouchableOpacity>
                          <Text style={styles.stepperValText}>{te.target_sets}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              triggerHapticSelection();
                              setTemplateExercises(prev =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, target_sets: item.target_sets + 1 } : item
                                )
                              );
                            }}
                            style={styles.miniStepBtn}
                          >
                            <Ionicons name="add" size={13} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Reps */}
                      <View style={[styles.stepperSubBlock, { flex: 1.4 }]}>
                        <Text style={styles.stepperSubBlockLabel}>TARGET REPS</Text>
                        <View style={styles.repRangeInline}>
                          {/* Min Reps */}
                          <View style={styles.stepperControlMini}>
                            <TouchableOpacity
                              onPress={() => {
                                triggerHapticSelection();
                                setTemplateExercises(prev =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, target_reps_min: Math.max(1, item.target_reps_min - 1) } : item
                                  )
                                );
                              }}
                              style={styles.miniStepBtn}
                            >
                              <Ionicons name="remove" size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.stepperValTextMini}>{te.target_reps_min}</Text>
                            <TouchableOpacity
                              onPress={() => {
                                triggerHapticSelection();
                                setTemplateExercises(prev =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          target_reps_min: item.target_reps_min + 1,
                                          target_reps_max: Math.max(item.target_reps_max, item.target_reps_min + 1)
                                        }
                                      : item
                                  )
                                );
                              }}
                              style={styles.miniStepBtn}
                            >
                              <Ionicons name="add" size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.rangeDash}>–</Text>

                          {/* Max Reps */}
                          <View style={styles.stepperControlMini}>
                            <TouchableOpacity
                              onPress={() => {
                                triggerHapticSelection();
                                setTemplateExercises(prev =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          target_reps_max: Math.max(item.target_reps_min, item.target_reps_max - 1)
                                        }
                                      : item
                                  )
                                );
                              }}
                              style={styles.miniStepBtn}
                            >
                              <Ionicons name="remove" size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.stepperValTextMini}>{te.target_reps_max}</Text>
                            <TouchableOpacity
                              onPress={() => {
                                triggerHapticSelection();
                                setTemplateExercises(prev =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, target_reps_max: item.target_reps_max + 1 } : item
                                  )
                                );
                              }}
                              style={styles.miniStepBtn}
                            >
                              <Ionicons name="add" size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Exercise Picker Modal */}
          <ExerciseSelectorModal
            visible={showExercisePicker}
            onClose={() => setShowExercisePicker(false)}
            onSelect={(ex) => {
              setTemplateExercises(prev => [
                ...prev,
                {
                  exercise: ex,
                  target_sets: 3,
                  target_reps_min: settings.defaultRepRangeMin || 8,
                  target_reps_max: settings.defaultRepRangeMax || 12
                }
              ]);
            }}
          />
        </View>
      </Modal>

      {/* Name Prompt Modal on First Install / Update (only after settings are loaded) */}
      <NamePromptModal
        visible={isLoaded && !settings.userName}
        onSave={(name) => updateSettings({ userName: name })}
      />
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
    color: THEME.colors.primary,
    letterSpacing: 1.2
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginTop: 2
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 20
  },
  quickStartCard: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  quickStartInfo: {
    flex: 1,
    marginRight: 12
  },
  quickStartTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800'
  },
  quickStartSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 4
  },
  startBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md
  },
  startBtnText: {
    color: '#0A0C10',
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 6
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1
  },
  newRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  newRoutineText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4
  },
  templatesList: {
    gap: 12
  },
  templateCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  templateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  templateName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary
  },
  templateNotes: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  trashBtn: {
    padding: 4
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  editPencilBtn: {
    padding: 4
  },
  templateExPreview: {
    gap: 4,
    marginBottom: 14
  },
  previewExText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500'
  },
  previewSetsText: {
    color: THEME.colors.textMuted,
    fontSize: 12
  },
  emptyTemplateText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic'
  },
  cardBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  editRoutineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14181F',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8
  },
  editRoutineText: {
    color: THEME.colors.cyan,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6
  },
  startRoutineBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceHighlight,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  startRoutineText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6
  },
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  saveTemplateBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  saveTemplateBtnText: {
    color: '#0A0C10',
    fontWeight: '800',
    fontSize: 13
  },
  modalContent: {
    padding: 16,
    gap: 18
  },
  fieldGroup: {
    gap: 8
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  addExChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: THEME.colors.primaryGlow
  },
  addExChipText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: THEME.colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  emptyAddBox: {
    padding: 20,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  emptyAddText: {
    color: THEME.colors.textMuted,
    fontSize: 13
  },
  templateExCard: {
    backgroundColor: THEME.colors.surface,
    padding: 12,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  templateExCardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reorderBtnsGroup: {
    flexDirection: 'column',
    gap: 2
  },
  reorderBtn: {
    width: 22,
    height: 18,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  deleteExBtn: {
    padding: 6
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 10
  },
  templateExSteppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  stepperSubBlock: {
    flex: 1
  },
  stepperSubBlockLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 4,
    paddingVertical: 3,
    justifyContent: 'space-between'
  },
  miniStepBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepperValText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  repRangeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  stepperControlMini: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 3,
    paddingVertical: 3,
    justifyContent: 'space-between'
  },
  stepperValTextMini: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  rangeDash: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '800'
  },
  templateExName: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4
  }
});
