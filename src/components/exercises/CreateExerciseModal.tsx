import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Equipment, Exercise, MuscleGroup } from '../../types';
import { THEME } from '../../constants/theme';
import { createCustomExercise } from '../../db/database';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

interface CreateExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Glutes', 'Full Body'
];

const EQUIPMENTS: Equipment[] = [
  'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Smith Machine', 'Other'
];

export const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({
  visible,
  onClose,
  onCreated
}) => {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Chest');
  const [equipment, setEquipment] = useState<Equipment>('Barbell');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an exercise name.');
      return;
    }
    setSaving(true);
    try {
      const created = await createCustomExercise(name, muscleGroup, equipment, notes);
      triggerHapticSuccess();
      onCreated(created);
      setName('');
      setNotes('');
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save custom exercise.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Custom Exercise</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Exercise Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EXERCISE NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Incline Smith Press, Pendlay Row..."
              placeholderTextColor={THEME.colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Muscle Group */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>TARGET MUSCLE GROUP</Text>
            <View style={styles.pillsWrap}>
              {MUSCLE_GROUPS.map((mg) => (
                <TouchableOpacity
                  key={mg}
                  style={[styles.pill, muscleGroup === mg && styles.pillActive]}
                  onPress={() => {
                    triggerHapticSelection();
                    setMuscleGroup(mg);
                  }}
                >
                  <Text style={[styles.pillText, muscleGroup === mg && styles.pillTextActive]}>
                    {mg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Equipment */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EQUIPMENT CATEGORY</Text>
            <View style={styles.pillsWrap}>
              {EQUIPMENTS.map((eq) => (
                <TouchableOpacity
                  key={eq}
                  style={[styles.pill, equipment === eq && styles.pillActive]}
                  onPress={() => {
                    triggerHapticSelection();
                    setEquipment(eq);
                  }}
                >
                  <Text style={[styles.pillText, equipment === eq && styles.pillTextActive]}>
                    {eq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>NOTES / CUES (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Form tips, seat settings, cue notes..."
              placeholderTextColor={THEME.colors.textMuted}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </ScrollView>
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
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  closeBtn: {
    padding: 6
  },
  saveBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  saveBtnText: {
    color: '#0A0C10',
    fontWeight: '800',
    fontSize: 14
  },
  content: {
    padding: 16,
    gap: 20
  },
  fieldGroup: {
    gap: 8
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8
  },
  input: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: THEME.colors.textPrimary,
    fontSize: 15
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  pill: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  pillActive: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: THEME.colors.primary
  },
  pillText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  pillTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700'
  }
});
