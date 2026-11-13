import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import {
  calculatePlates,
  AvailablePlates,
  DEFAULT_LBS_INVENTORY,
  DEFAULT_KG_INVENTORY,
  LBS_PLATES,
  KG_PLATES
} from '../../utils/plateCalculator';
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
  const { settings } = useSettings();
  const [unit, setUnit] = useState<'lbs' | 'kg'>(settings.unit);
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight || (settings.unit === 'lbs' ? 225 : 100));
  const [barWeight, setBarWeight] = useState<number>(settings.unit === 'lbs' ? 45 : 20);

  // Available Plates Inventory state
  const [lbsInventory, setLbsInventory] = useState<AvailablePlates>(DEFAULT_LBS_INVENTORY);
  const [kgInventory, setKgInventory] = useState<AvailablePlates>(DEFAULT_KG_INVENTORY);
  const [showInventoryEditor, setShowInventoryEditor] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const savedLbs = await AsyncStorage.getItem('@lift_plates_inventory_lbs');
        if (savedLbs) setLbsInventory(JSON.parse(savedLbs));

        const savedKg = await AsyncStorage.getItem('@lift_plates_inventory_kg');
        if (savedKg) setKgInventory(JSON.parse(savedKg));
      } catch (e) {
        console.warn('Failed to load plate inventory:', e);
      }
    })();
  }, []);

  const activeInventory = unit === 'lbs' ? lbsInventory : kgInventory;

  const updateInventoryCount = async (plateWeight: number, delta: number) => {
    triggerHapticSelection();
    if (unit === 'lbs') {
      const current = lbsInventory[plateWeight] !== undefined ? lbsInventory[plateWeight] : 4;
      const next = Math.max(0, current + delta);
      const updated = { ...lbsInventory, [plateWeight]: next };
      setLbsInventory(updated);
      await AsyncStorage.setItem('@lift_plates_inventory_lbs', JSON.stringify(updated));
    } else {
      const current = kgInventory[plateWeight] !== undefined ? kgInventory[plateWeight] : 4;
      const next = Math.max(0, current + delta);
      const updated = { ...kgInventory, [plateWeight]: next };
      setKgInventory(updated);
      await AsyncStorage.setItem('@lift_plates_inventory_kg', JSON.stringify(updated));
    }
  };

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

  const calc = calculatePlates(targetWeight, barWeight, unit, activeInventory);
  const availableDefs = unit === 'lbs' ? LBS_PLATES : KG_PLATES;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plate Calculator</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

          {/* Target Weight Input Card (WITHOUT side step buttons) */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>TARGET TOTAL WEIGHT</Text>
            <View style={styles.cleanWeightInputContainer}>
              <TextInput
                style={styles.cleanWeightInput}
                keyboardType="numeric"
                value={targetWeight > 0 ? String(targetWeight) : ''}
                placeholder="0"
                placeholderTextColor="#737373"
                onChangeText={(txt) => {
                  const val = parseFloat(txt);
                  setTargetWeight(isNaN(val) ? 0 : val);
                }}
                selectTextOnFocus
              />
              <Text style={styles.cleanWeightUnit}>{unit}</Text>
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

          {/* Available Plates Inventory (Only load plates I have available) */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.inventoryHeaderRow}
              onPress={() => {
                triggerHapticSelection();
                setShowInventoryEditor(!showInventoryEditor);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>AVAILABLE PLATES INVENTORY</Text>
                <Text style={styles.inventorySub}>
                  {showInventoryEditor ? 'Customize pairs of plates you have on hand' : 'Tap to adjust available plate counts'}
                </Text>
              </View>
              <Ionicons
                name={showInventoryEditor ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#737373"
              />
            </TouchableOpacity>

            {showInventoryEditor && (
              <View style={styles.inventoryGrid}>
                {availableDefs.map((p) => {
                  const pairs = activeInventory[p.weight] !== undefined ? activeInventory[p.weight] : 0;
                  return (
                    <View key={p.weight} style={styles.inventoryTile}>
                      <View style={[styles.plateDot, { backgroundColor: p.color }]} />
                      <Text style={styles.inventoryPlateName}>{p.weight} {unit}</Text>
                      <View style={styles.stepperMini}>
                        <TouchableOpacity
                          style={styles.stepMiniBtn}
                          onPress={() => updateInventoryCount(p.weight, -1)}
                        >
                          <Ionicons name="remove" size={14} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text style={styles.inventoryCountText}>{pairs} pr</Text>

                        <TouchableOpacity
                          style={styles.stepMiniBtn}
                          onPress={() => updateInventoryCount(p.weight, 1)}
                        >
                          <Ionicons name="add" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
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
              <Text style={styles.summaryTitle}>LOAD PER SIDE: </Text>
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
                      {p.weight} {unit} plate{p.countPerSide > 1 ? 's' : ''} (each side)
                    </Text>
                  </View>
                ))
              )}
            </View>

            {calc.remainingWeight > 0 && (
              <View style={styles.warnBox}>
                <Ionicons name="information-circle" size={16} color={THEME.colors.gold} />
                <Text style={styles.warnText}>
                  Notice: Only {calc.achievedTotalWeight} {unit} could be loaded with your available plates. Missing {calc.remainingWeight} {unit}.
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
    backgroundColor: '#000000'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#262626'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  closeBtn: {
    padding: 6
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#262626'
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
    fontSize: 13,
    fontWeight: '600',
    color: '#A8A8A8'
  },
  toggleTextActive: {
    color: '#000000',
    fontWeight: '800'
  },
  card: {
    backgroundColor: '#000000',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626'
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#737373',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  cleanWeightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 8
  },
  cleanWeightInput: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    minWidth: 120,
    padding: 0
  },
  cleanWeightUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  barPresetsRow: {
    flexDirection: 'row',
    gap: 10
  },
  barPresetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#121212',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626'
  },
  barPresetBtnActive: {
    backgroundColor: `${THEME.colors.primary}20`,
    borderColor: THEME.colors.primary
  },
  barPresetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8A8A8'
  },
  barPresetTextActive: {
    color: THEME.colors.primary,
    fontWeight: '800'
  },
  inventoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inventorySub: {
    fontSize: 11,
    color: '#737373',
    marginTop: 2
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#1C1C1C'
  },
  inventoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 8,
    width: '48.5%'
  },
  inventoryPlateName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1
  },
  stepperMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  stepMiniBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333'
  },
  inventoryCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A8A8A8',
    minWidth: 26,
    textAlign: 'center'
  },
  barbellVisualContainer: {
    height: 120,
    backgroundColor: '#121212',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#262626'
  },
  barbellShaft: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#262626',
    borderRadius: 2
  },
  barbellCollar: {
    width: 14,
    height: 60,
    backgroundColor: '#404040',
    borderRadius: 4,
    marginRight: 6,
    zIndex: 2
  },
  platesStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 2,
    flex: 1
  },
  plateSlice: {
    width: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)'
  },
  plateSliceText: {
    fontSize: 9,
    fontWeight: '900',
    transform: [{ rotate: '-90deg' }]
  },
  noPlatesText: {
    fontSize: 12,
    color: '#737373',
    fontStyle: 'italic',
    marginLeft: 12
  },
  summaryCard: {
    backgroundColor: '#121212'
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A8A8A8'
  },
  summaryWeight: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.primary
  },
  plateList: {
    gap: 8
  },
  plateListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  plateDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  plateListCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  plateListWeight: {
    fontSize: 14,
    color: '#A8A8A8',
    fontWeight: '600'
  },
  emptyText: {
    fontSize: 13,
    color: '#737373'
  },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)'
  },
  warnText: {
    fontSize: 12,
    color: THEME.colors.gold,
    flex: 1,
    lineHeight: 16
  }
});
