import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { triggerHapticSelection } from '../../utils/haptics';

interface RestTimerPickerModalProps {
  visible: boolean;
  currentDurationSeconds: number;
  onClose: () => void;
  onSelectDuration: (seconds: number, saveAsExerciseDefault?: boolean) => void;
  exerciseName?: string;
}

const PRESET_DURATIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300];

export const RestTimerPickerModal: React.FC<RestTimerPickerModalProps> = ({
  visible,
  currentDurationSeconds,
  onClose,
  onSelectDuration,
  exerciseName
}) => {
  const [seconds, setSeconds] = useState(currentDurationSeconds || 90);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;

  const adjustSeconds = (delta: number) => {
    triggerHapticSelection();
    setSeconds(prev => Math.max(15, prev + delta));
  };

  const handleApply = () => {
    triggerHapticSelection();
    onSelectDuration(seconds, saveAsDefault);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>CUSTOM REST TIMER</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={20} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {exerciseName ? (
            <Text style={styles.subtext}>For {exerciseName}</Text>
          ) : null}

          {/* Stepper Display */}
          <View style={styles.stepperBox}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustSeconds(-15)}>
              <Text style={styles.stepBtnText}>-15s</Text>
            </TouchableOpacity>

            <View style={styles.timeDisplay}>
              <Text style={styles.timeNumber}>
                {String(mins).padStart(2, '0')}:{String(remSecs).padStart(2, '0')}
              </Text>
              <Text style={styles.timeLabel}>MIN : SEC</Text>
            </View>

            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustSeconds(15)}>
              <Text style={styles.stepBtnText}>+15s</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Presets Grid */}
          <View style={styles.presetsGrid}>
            {PRESET_DURATIONS.map((preset) => {
              const isSelected = seconds === preset;
              const pMin = Math.floor(preset / 60);
              const pSec = preset % 60;
              const label = pSec === 0 ? `${pMin}m` : pMin > 0 ? `${pMin}m ${pSec}s` : `${pSec}s`;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => {
                    triggerHapticSelection();
                    setSeconds(preset);
                  }}
                >
                  <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save as default for this exercise checkbox */}
          {exerciseName && (
            <TouchableOpacity
              style={styles.defaultCheckboxRow}
              onPress={() => setSaveAsDefault(!saveAsDefault)}
            >
              <Ionicons
                name={saveAsDefault ? 'checkbox' : 'square-outline'}
                size={18}
                color={saveAsDefault ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text style={styles.checkboxText}>
                Remember this rest time for {exerciseName}
              </Text>
            </TouchableOpacity>
          )}

          {/* Start / Set Button */}
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>START REST TIMER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.cyan,
    letterSpacing: 1
  },
  subtext: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    marginTop: -8
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  stepBtn: {
    backgroundColor: THEME.colors.surfaceHighlight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8
  },
  stepBtnText: {
    color: THEME.colors.cyan,
    fontWeight: '800',
    fontSize: 13
  },
  timeDisplay: {
    alignItems: 'center'
  },
  timeNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    fontVariant: ['tabular-nums']
  },
  timeLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  presetChip: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  presetChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: THEME.colors.cyan
  },
  presetChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  presetChipTextActive: {
    color: THEME.colors.cyan
  },
  defaultCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  checkboxText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    flex: 1
  },
  applyBtn: {
    backgroundColor: THEME.colors.cyan,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.lg,
    alignItems: 'center'
  },
  applyBtnText: {
    color: '#08090B',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.8
  }
});
