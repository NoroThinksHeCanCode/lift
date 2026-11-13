import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

interface RepRangePickerModalProps {
  visible: boolean;
  exerciseName: string;
  initialMin: number;
  initialMax: number;
  onSave: (min: number, max: number) => void;
  onClose: () => void;
}

const PRESETS = [
  { min: 3, max: 5, label: '3–5 (Strength)' },
  { min: 6, max: 8, label: '6–8 (Heavy)' },
  { min: 8, max: 12, label: '8–12 (Hypertrophy)' },
  { min: 10, max: 15, label: '10–15 (Volume)' },
  { min: 12, max: 15, label: '12–15 (Endurance)' },
  { min: 15, max: 20, label: '15–20 (Pump)' },
];

export const RepRangePickerModal: React.FC<RepRangePickerModalProps> = ({
  visible,
  exerciseName,
  initialMin,
  initialMax,
  onSave,
  onClose,
}) => {
  const [minReps, setMinReps] = useState<number>(initialMin || 8);
  const [maxReps, setMaxReps] = useState<number>(initialMax || 12);

  useEffect(() => {
    if (visible) {
      setMinReps(initialMin || 8);
      setMaxReps(initialMax || 12);
    }
  }, [visible, initialMin, initialMax]);

  const handleApplyPreset = (min: number, max: number) => {
    triggerHapticSelection();
    setMinReps(min);
    setMaxReps(max);
  };

  const handleSave = () => {
    triggerHapticSuccess();
    const finalMin = Math.max(1, minReps);
    const finalMax = Math.max(finalMin, maxReps);
    onSave(finalMin, finalMax);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Target Rep Range</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{exerciseName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.desc}>
              Hitting the ceiling ({maxReps} reps) triggers a progressive overload prompt to increase weight.
            </Text>

            {/* Steppers Row */}
            <View style={styles.steppersRow}>
              {/* Min Reps */}
              <View style={styles.stepperBox}>
                <Text style={styles.stepperLabel}>MIN REPS</Text>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => {
                      triggerHapticSelection();
                      setMinReps(prev => Math.max(1, prev - 1));
                    }}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.repInput}
                    keyboardType="number-pad"
                    value={String(minReps)}
                    onChangeText={text => {
                      const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      setMinReps(isNaN(val) ? 1 : val);
                    }}
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => {
                      triggerHapticSelection();
                      setMinReps(prev => {
                        const next = prev + 1;
                        if (next > maxReps) setMaxReps(next);
                        return next;
                      });
                    }}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.dash}>–</Text>

              {/* Max Reps */}
              <View style={styles.stepperBox}>
                <Text style={styles.stepperLabel}>MAX REPS (TARGET)</Text>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => {
                      triggerHapticSelection();
                      setMaxReps(prev => Math.max(minReps, prev - 1));
                    }}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.repInput}
                    keyboardType="number-pad"
                    value={String(maxReps)}
                    onChangeText={text => {
                      const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      setMaxReps(isNaN(val) ? minReps : Math.max(minReps, val));
                    }}
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => {
                      triggerHapticSelection();
                      setMaxReps(prev => prev + 1);
                    }}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Presets */}
            <Text style={styles.sectionTitle}>QUICK PRESETS</Text>
            <View style={styles.presetsGrid}>
              {PRESETS.map((p, idx) => {
                const isSelected = minReps === p.min && maxReps === p.max;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => handleApplyPreset(p.min, p.max)}
                  >
                    <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save Rep Range ({minReps}–{maxReps})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    padding: 4,
  },
  desc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 17,
    marginBottom: 16,
  },
  steppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  stepperBox: {
    flex: 1,
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dash: {
    fontSize: 22,
    color: THEME.colors.textMuted,
    marginHorizontal: 8,
    marginTop: 14,
    fontWeight: '300',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  repInput: {
    width: 48,
    height: 36,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  presetChipActive: {
    backgroundColor: `${THEME.colors.primary}20`,
    borderColor: THEME.colors.primary,
  },
  presetText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  presetTextActive: {
    color: THEME.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});
