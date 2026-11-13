import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { calculateOneRepMax } from '../../utils/oneRepMax';
import { triggerHapticSelection } from '../../utils/haptics';

interface OneRepMaxModalProps {
  visible: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialReps?: number;
}

export const OneRepMaxModal: React.FC<OneRepMaxModalProps> = ({
  visible,
  onClose,
  initialWeight = 185,
  initialReps = 5
}) => {
  const { settings } = useSettings();
  const [weight, setWeight] = useState<number>(initialWeight);
  const [reps, setReps] = useState<number>(initialReps);

  const result = calculateOneRepMax(weight, reps);

  const adjustWeight = (delta: number) => {
    triggerHapticSelection();
    setWeight(prev => Math.max(0, prev + delta));
  };

  const adjustReps = (delta: number) => {
    triggerHapticSelection();
    setReps(prev => Math.max(1, prev + delta));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>1 RM Calculator</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Inputs Row */}
          <View style={styles.inputsRow}>
            {/* Weight Input */}
            <View style={styles.cardHalf}>
              <Text style={styles.label}>WEIGHT ({settings.unit})</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWeight(-5)}>
                  <Ionicons name="remove" size={16} color={THEME.colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  value={String(weight)}
                  onChangeText={(txt) => {
                    const val = parseFloat(txt);
                    setWeight(isNaN(val) ? 0 : val);
                  }}
                />
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWeight(5)}>
                  <Ionicons name="add" size={16} color={THEME.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reps Input */}
            <View style={styles.cardHalf}>
              <Text style={styles.label}>REPS PERFORMED</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjustReps(-1)}>
                  <Ionicons name="remove" size={16} color={THEME.colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  value={String(reps)}
                  onChangeText={(txt) => {
                    const val = parseInt(txt, 10);
                    setReps(isNaN(val) ? 1 : val);
                  }}
                />
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjustReps(1)}>
                  <Ionicons name="add" size={16} color={THEME.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Big 1RM Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroSub}>ESTIMATED ONE-REP MAX</Text>
            <View style={styles.heroValueRow}>
              <Text style={styles.heroValue}>{result.average}</Text>
              <Text style={styles.heroUnit}>{settings.unit}</Text>
            </View>
            <View style={styles.formulaRow}>
              <Text style={styles.formulaText}>Epley: {result.epley} {settings.unit}</Text>
              <Text style={styles.formulaDot}>•</Text>
              <Text style={styles.formulaText}>Brzycki: {result.brzycki} {settings.unit}</Text>
            </View>
          </View>

          {/* Percentages Table */}
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>PERCENTAGES & REP RANGES</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, { flex: 1 }]}>PERCENTAGE</Text>
              <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>WEIGHT</Text>
              <Text style={[styles.colHeader, { flex: 1, textAlign: 'right' }]}>TARGET REPS</Text>
            </View>

            {result.percentages.map((p, idx) => (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <View style={[styles.pctBadge, p.percentage === 100 && styles.pctBadge100]}>
                  <Text style={[styles.pctText, p.percentage === 100 && styles.pctText100]}>
                    {p.percentage}%
                  </Text>
                </View>
                <Text style={styles.weightCell}>
                  {p.weight} {settings.unit}
                </Text>
                <Text style={styles.repsCell}>{p.estimatedReps}</Text>
              </View>
            ))}
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
  content: {
    padding: 16,
    gap: 16
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12
  },
  cardHalf: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  stepBtn: {
    padding: 10
  },
  numericInput: {
    flex: 1,
    height: 40,
    textAlign: 'center',
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800'
  },
  heroCard: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 1,
    marginBottom: 8
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6
  },
  heroValue: {
    fontSize: 52,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -1
  },
  heroUnit: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginLeft: 8
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  formulaText: {
    fontSize: 12,
    color: THEME.colors.textMuted
  },
  formulaDot: {
    marginHorizontal: 8,
    color: THEME.colors.textMuted
  },
  tableCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  tableTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 6
  },
  pctBadge: {
    flex: 1,
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  pctBadge100: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: THEME.colors.primary
  },
  pctText: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  pctText100: {
    color: THEME.colors.primary
  },
  weightCell: {
    flex: 1,
    textAlign: 'center',
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  repsCell: {
    flex: 1,
    textAlign: 'right',
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500'
  }
});
