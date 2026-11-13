import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { calculatePlates } from '../../utils/plateCalculator';
import { triggerHapticSelection } from '../../utils/haptics';

interface PlateCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  initialWeight?: number;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  visible,
  onClose,
  initialWeight
}) => {
  const { settings, toggleUnit } = useSettings();
  const [unit, setUnit] = useState<'lbs' | 'kg'>(settings.unit);
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight || (settings.unit === 'lbs' ? 225 : 100));
  const [barWeight, setBarWeight] = useState<number>(unit === 'lbs' ? 45 : 20);

  const calc = calculatePlates(targetWeight, barWeight, unit);

  const handleUnitSwitch = (newUnit: 'lbs' | 'kg') => {
    triggerHapticSelection();
    if (newUnit === unit) return;
    setUnit(newUnit);
    if (newUnit === 'kg') {
      setBarWeight(20);
      setTargetWeight(Math.round(targetWeight / 2.20462 / 2.5) * 2.5 || 100);
    } else {
      setBarWeight(45);
      setTargetWeight(Math.round((targetWeight * 2.20462) / 5) * 5 || 225);
    }
  };

  const adjustWeight = (delta: number) => {
    triggerHapticSelection();
    setTargetWeight(prev => Math.max(barWeight, prev + delta));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plate Calculator</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Unit Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, unit === 'lbs' && styles.toggleBtnActive]}
              onPress={() => handleUnitSwitch('lbs')}
            >
              <Text style={[styles.toggleText, unit === 'lbs' && styles.toggleTextActive]}>LBS (Pounds)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, unit === 'kg' && styles.toggleBtnActive]}
              onPress={() => handleUnitSwitch('kg')}
            >
              <Text style={[styles.toggleText, unit === 'kg' && styles.toggleTextActive]}>KG (Kilograms)</Text>
            </TouchableOpacity>
          </View>

          {/* Target Weight Input Card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>TARGET TOTAL WEIGHT</Text>
            <View style={styles.weightInputRow}>
              <TouchableOpacity style={styles.deltaBtn} onPress={() => adjustWeight(unit === 'lbs' ? -10 : -5)}>
                <Text style={styles.deltaText}>{unit === 'lbs' ? '-10' : '-5'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deltaBtn} onPress={() => adjustWeight(unit === 'lbs' ? -5 : -2.5)}>
                <Text style={styles.deltaText}>{unit === 'lbs' ? '-5' : '-2.5'}</Text>
              </TouchableOpacity>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  value={String(targetWeight)}
                  onChangeText={(txt) => {
                    const val = parseFloat(txt);
                    setTargetWeight(isNaN(val) ? 0 : val);
                  }}
                />
                <Text style={styles.weightUnit}>{unit}</Text>
              </View>

              <TouchableOpacity style={styles.deltaBtn} onPress={() => adjustWeight(unit === 'lbs' ? 5 : 2.5)}>
                <Text style={styles.deltaText}>{unit === 'lbs' ? '+5' : '+2.5'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deltaBtn} onPress={() => adjustWeight(unit === 'lbs' ? 10 : 5)}>
                <Text style={styles.deltaText}>{unit === 'lbs' ? '+10' : '+5'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Barbell Weight Selection */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>BARBELL WEIGHT</Text>
            <View style={styles.barPresetsRow}>
              {(unit === 'lbs' ? [45, 35, 15] : [20, 15, 10]).map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.barPresetBtn, barWeight === b && styles.barPresetBtnActive]}
                  onPress={() => {
                    triggerHapticSelection();
                    setBarWeight(b);
                  }}
                >
                  <Text style={[styles.barPresetText, barWeight === b && styles.barPresetTextActive]}>
                    {b} {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Visual Barbell Representation */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>BARBELL SLEEVE (ONE SIDE)</Text>
            <View style={styles.barbellVisualContainer}>
              {/* Barbell Shaft */}
              <View style={styles.barbellShaft} />
              {/* Collar Stopper */}
              <View style={styles.barbellCollar} />

              {/* Stacked Plates */}
              <View style={styles.platesStack}>
                {calc.platesPerSide.length === 0 ? (
                  <Text style={styles.noPlatesText}>No plates needed (empty bar)</Text>
                ) : (
                  calc.platesPerSide.flatMap((plate, pIdx) =>
                    Array.from({ length: plate.countPerSide }).map((_, i) => {
                      // Plate height based on weight
                      const heightRatio = Math.max(45, Math.min(100, 35 + plate.weight * 1.4));
                      return (
                        <View
                          key={`${pIdx}_${i}`}
                          style={[
                            styles.plateSlice,
                            {
                              backgroundColor: plate.color,
                              height: heightRatio
                            }
                          ]}
                        >
                          <Text style={[styles.plateSliceText, { color: plate.textColor }]}>
                            {plate.weight}
                          </Text>
                        </View>
                      );
                    })
                  )
                )}
              </View>
            </View>
          </View>

          {/* Summary / Loading Instructions */}
          <View style={[styles.card, styles.summaryCard]}>
            <View style={styles.summaryHeaderRow}>
              <Text style={styles.summaryTitle}>PER SIDE: </Text>
              <Text style={styles.summaryWeight}>
                {calc.weightPerSide} {unit}
              </Text>
            </View>

            <View style={styles.plateList}>
              {calc.platesPerSide.length === 0 ? (
                <Text style={styles.emptyText}>Just load the empty barbell.</Text>
              ) : (
                calc.platesPerSide.map((p, idx) => (
                  <View key={idx} style={styles.plateListItem}>
                    <View style={[styles.plateDot, { backgroundColor: p.color }]} />
                    <Text style={styles.plateListCount}>{p.countPerSide} × </Text>
                    <Text style={styles.plateListWeight}>
                      {p.weight} {unit} plate{p.countPerSide > 1 ? 's' : ''}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {calc.remainingWeight > 0 && (
              <View style={styles.warnBox}>
                <Ionicons name="information-circle" size={16} color={THEME.colors.gold} />
                <Text style={styles.warnText}>
                  Remaining: {calc.remainingWeight} {unit} cannot be loaded evenly with available plates.
                </Text>
              </View>
            )}
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.md,
    padding: 4
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.primary
  },
  toggleText: {
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    fontSize: 14
  },
  toggleTextActive: {
    color: '#0A0C10'
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  deltaBtn: {
    backgroundColor: THEME.colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  deltaText: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    fontSize: 13
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  weightInput: {
    height: 48,
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    minWidth: 70
  },
  weightUnit: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4
  },
  barPresetsRow: {
    flexDirection: 'row',
    gap: 10
  },
  barPresetBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  barPresetBtnActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryGlow
  },
  barPresetText: {
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13
  },
  barPresetTextActive: {
    color: THEME.colors.primary
  },
  barbellVisualContainer: {
    height: 120,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden'
  },
  barbellShaft: {
    width: 28,
    height: 18,
    backgroundColor: '#94A3B8',
    borderRadius: 2
  },
  barbellCollar: {
    width: 14,
    height: 44,
    backgroundColor: '#64748B',
    borderRadius: 2
  },
  platesStack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
    gap: 3
  },
  plateSlice: {
    width: 24,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)'
  },
  plateSliceText: {
    fontSize: 8,
    fontWeight: '800'
  },
  noPlatesText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    marginLeft: 12
  },
  summaryCard: {
    backgroundColor: THEME.colors.surfaceElevated
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12
  },
  summaryTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700'
  },
  summaryWeight: {
    color: THEME.colors.primary,
    fontSize: 22,
    fontWeight: '900'
  },
  plateList: {
    gap: 8
  },
  plateListItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  plateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10
  },
  plateListCount: {
    color: THEME.colors.textPrimary,
    fontWeight: '800',
    fontSize: 15
  },
  plateListWeight: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500'
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 14
  },
  warnBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.goldGlow,
    padding: 10,
    borderRadius: 8
  },
  warnText: {
    color: THEME.colors.gold,
    fontSize: 12,
    marginLeft: 8,
    flex: 1
  }
});
