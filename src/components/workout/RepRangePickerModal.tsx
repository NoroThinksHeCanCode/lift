import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

interface RepRangePickerModalProps {
  visible: boolean;
  exerciseName?: string;
  initialMin: number;
  initialMax: number;
  allowWorkoutWideToggle?: boolean;
  onSave: (min: number, max: number, applyToAll: boolean) => void;
  onClose: () => void;
}

export const RepRangePickerModal: React.FC<RepRangePickerModalProps> = ({
  visible,
  exerciseName = 'Workout Target',
  initialMin,
  initialMax,
  allowWorkoutWideToggle = true,
  onSave,
  onClose,
}) => {
  const [minReps, setMinReps] = useState<number>(initialMin || 8);
  const [maxReps, setMaxReps] = useState<number>(initialMax || 12);
  const [applyToAll, setApplyToAll] = useState<boolean>(true);

  useEffect(() => {
    if (visible) {
      setMinReps(initialMin || 8);
      setMaxReps(initialMax || 12);
    }
  }, [visible, initialMin, initialMax]);

  const handleSave = () => {
    triggerHapticSuccess();
    const finalMin = Math.max(1, minReps);
    const finalMax = Math.max(finalMin, maxReps);
    onSave(finalMin, finalMax, applyToAll);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Target Rep Range</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{exerciseName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.desc}>
              When you hit the target ceiling ({maxReps} reps), Lift prompts you to increase weight for progressive overload.
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
                    <Ionicons name="remove" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.inputWrapper}>
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
                  </View>

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
                    <Ionicons name="add" size={20} color="#FFFFFF" />
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
                    <Ionicons name="remove" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.inputWrapper}>
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
                  </View>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => {
                      triggerHapticSelection();
                      setMaxReps(prev => prev + 1);
                    }}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Workout-Wide Toggle Menu */}
            {allowWorkoutWideToggle && (
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.toggleLabel}>Apply to Entire Workout</Text>
                  <Text style={styles.toggleSub}>Use this rep range across all exercises in this session</Text>
                </View>
                <Switch
                  value={applyToAll}
                  onValueChange={val => {
                    triggerHapticSelection();
                    setApplyToAll(val);
                  }}
                  trackColor={{ false: '#262626', true: THEME.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save ({minReps}–{maxReps} Reps)</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262626',
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
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 270,
  },
  closeBtn: {
    padding: 4,
  },
  desc: {
    fontSize: 12,
    color: '#737373',
    lineHeight: 17,
    marginBottom: 18,
  },
  steppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  stepperBox: {
    flex: 1,
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737373',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dash: {
    fontSize: 24,
    color: '#737373',
    marginHorizontal: 4,
    marginTop: 12,
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
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  inputWrapper: {
    minWidth: 54,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repInput: {
    width: '100%',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleSub: {
    fontSize: 11,
    color: '#737373',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8A8A8',
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
