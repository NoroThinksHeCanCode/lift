import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SetType, WorkoutSet } from '../../types';
import { THEME } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { triggerHapticSelection } from '../../utils/haptics';

interface SetRowProps {
  set: WorkoutSet;
  previousInfo?: { weight: number; reps: number; set_type: SetType; rpe?: number };
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  previousInfo,
  onUpdate,
  onToggleComplete,
  onDelete
}) => {
  const { settings } = useSettings();

  const cycleSetType = () => {
    triggerHapticSelection();
    const sequence: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
    const nextIdx = (sequence.indexOf(set.set_type) + 1) % sequence.length;
    onUpdate({ set_type: sequence[nextIdx] });
  };

  const getSetTypeBadge = () => {
    switch (set.set_type) {
      case 'warmup':
        return { label: 'W', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'drop':
        return { label: 'D', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'failure':
        return { label: 'F', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      default:
        return { label: `${set.set_number}`, color: THEME.colors.textSecondary, bg: THEME.colors.surfaceHighlight };
    }
  };

  const typeBadge = getSetTypeBadge();

  return (
    <View style={[styles.container, set.is_completed && styles.containerCompleted]}>
      {/* Set Number / Type toggle */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={cycleSetType}
        style={[styles.typeButton, { backgroundColor: typeBadge.bg }]}
      >
        <Text style={[styles.typeText, { color: typeBadge.color }]}>{typeBadge.label}</Text>
      </TouchableOpacity>

      {/* Previous Best */}
      <View style={styles.previousCol}>
        <Text style={styles.previousText} numberOfLines={1}>
          {previousInfo ? `${previousInfo.weight}×${previousInfo.reps}` : '—'}
        </Text>
        {previousInfo?.rpe ? (
          <Text style={styles.prevRpeText}>@{previousInfo.rpe}</Text>
        ) : null}
      </View>

      {/* Weight Input */}
      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, set.is_completed && styles.inputCompleted]}
          keyboardType="numeric"
          defaultValue={set.weight > 0 ? String(set.weight) : ''}
          placeholder={previousInfo ? String(previousInfo.weight) : '0'}
          placeholderTextColor={THEME.colors.textMuted}
          onChangeText={(txt) => {
            const parsed = parseFloat(txt);
            onUpdate({ weight: isNaN(parsed) ? 0 : parsed });
          }}
        />
        <Text style={styles.unitLabel}>{settings.unit}</Text>
      </View>

      {/* Reps Input */}
      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, set.is_completed && styles.inputCompleted]}
          keyboardType="numeric"
          defaultValue={set.reps > 0 ? String(set.reps) : ''}
          placeholder={previousInfo ? String(previousInfo.reps) : '10'}
          placeholderTextColor={THEME.colors.textMuted}
          onChangeText={(txt) => {
            const parsed = parseInt(txt, 10);
            onUpdate({ reps: isNaN(parsed) ? 0 : parsed });
          }}
        />
        <Text style={styles.unitLabel}>reps</Text>
      </View>

      {/* RPE / RIR Input (Feature 2) */}
      <View style={[styles.inputCol, styles.rpeCol]}>
        <TextInput
          style={[styles.input, styles.rpeInput, set.is_completed && styles.inputCompleted]}
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor={THEME.colors.textMuted}
          defaultValue={set.rpe !== undefined && set.rpe !== null ? String(set.rpe) : ''}
          onChangeText={(txt) => {
            const parsed = parseFloat(txt);
            onUpdate({ rpe: isNaN(parsed) ? undefined : parsed });
          }}
        />
        <Text style={styles.unitLabel}>{settings.rpeScale === 'RPE' ? '@' : 'RIR'}</Text>
      </View>

      {/* Complete Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggleComplete}
        style={[
          styles.checkBtn,
          set.is_completed ? styles.checkBtnCompleted : styles.checkBtnUncompleted
        ]}
      >
        {set.is_completed ? (
          <Ionicons name="checkmark" size={18} color="#08090B" />
        ) : (
          <Ionicons name="checkmark-outline" size={16} color={THEME.colors.textMuted} />
        )}
      </TouchableOpacity>

      {/* Delete set */}
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={14} color={THEME.colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  containerCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  typeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6
  },
  typeText: {
    fontWeight: '800',
    fontSize: 12
  },
  previousCol: {
    width: 58,
    justifyContent: 'center',
    alignItems: 'center'
  },
  previousText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600'
  },
  prevRpeText: {
    color: THEME.colors.cyan,
    fontSize: 9,
    fontWeight: '700'
  },
  inputCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 6,
    marginHorizontal: 3,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  rpeCol: {
    flex: 0.8
  },
  input: {
    flex: 1,
    height: 34,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    padding: 0
  },
  rpeInput: {
    fontSize: 12,
    color: THEME.colors.cyan
  },
  inputCompleted: {
    color: THEME.colors.primary
  },
  unitLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700'
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4
  },
  checkBtnCompleted: {
    backgroundColor: THEME.colors.primary
  },
  checkBtnUncompleted: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  deleteBtn: {
    padding: 3,
    marginLeft: 2
  }
});
