import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MachineVariant } from '../../types';
import { THEME } from '../../constants/theme';
import { addMachineToExercise } from '../../db/database';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

interface MachineSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  currentMachine?: MachineVariant;
  availableMachines: MachineVariant[];
  onSelectMachine: (machine: MachineVariant) => void;
  onMachineAdded: (newMachine: MachineVariant) => void;
}

export const MachineSelectorModal: React.FC<MachineSelectorModalProps> = ({
  visible,
  onClose,
  exerciseId,
  exerciseName,
  currentMachine,
  availableMachines,
  onSelectMachine,
  onMachineAdded
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newSeatSetting, setNewSeatSetting] = useState('');
  const [newRatio, setNewRatio] = useState('1.0');

  const handleSelect = (m: MachineVariant) => {
    triggerHapticSelection();
    onSelectMachine(m);
    onClose();
  };

  const handleCreate = async () => {
    if (!newMachineName.trim()) {
      Alert.alert('Required', 'Please enter the machine name (e.g. Hammer Strength Incline).');
      return;
    }
    const ratio = parseFloat(newRatio) || 1.0;
    const created = await addMachineToExercise(
      exerciseId,
      newMachineName,
      newBrand,
      newSeatSetting,
      ratio
    );
    triggerHapticSuccess();
    onMachineAdded(created);
    onSelectMachine(created);
    setNewMachineName('');
    setNewBrand('');
    setNewSeatSetting('');
    setShowAddForm(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
            <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Machines for {exerciseName}
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={18} color={THEME.colors.primary} />
            <Text style={styles.addBtnText}>{showAddForm ? 'Cancel' : 'New'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {showAddForm && (
            <View style={styles.addCard}>
              <Text style={styles.addTitle}>ADD GYM MACHINE / VARIANT</Text>

              <Text style={styles.inputLabel}>MACHINE NAME / MODEL</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hammer Strength Iso-Lateral, Prime Cam..."
                placeholderTextColor={THEME.colors.textMuted}
                value={newMachineName}
                onChangeText={setNewMachineName}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>BRAND (OPTIONAL)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Cybex, Life Fitness"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={newBrand}
                    onChangeText={setNewBrand}
                  />
                </View>
                <View style={{ width: 100 }}>
                  <Text style={styles.inputLabel}>RATIO</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1.0 or 0.5"
                    placeholderTextColor={THEME.colors.textMuted}
                    keyboardType="numeric"
                    value={newRatio}
                    onChangeText={setNewRatio}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>MY SEAT / PIN SETTING</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Seat #4, Backrest #2, Pulley #7"
                placeholderTextColor={THEME.colors.textMuted}
                value={newSeatSetting}
                onChangeText={setNewSeatSetting}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveBtnText}>Save & Select Machine</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>AVAILABLE MACHINES & PULLEYS</Text>

          {availableMachines.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="hardware-chip-outline" size={40} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No specific machines configured</Text>
              <Text style={styles.emptySub}>
                Add your gym's specific machine brand, seat height, and pulley settings!
              </Text>
            </View>
          ) : (
            availableMachines.map((m) => {
              const isSelected = currentMachine?.id === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.machineCard, isSelected && styles.machineCardActive]}
                  onPress={() => handleSelect(m)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.machineName}>{m.name}</Text>
                      {isSelected && (
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>

                    {m.brand ? (
                      <Text style={styles.brandText}>Brand: {m.brand}</Text>
                    ) : null}

                    {m.seat_setting ? (
                      <View style={styles.settingBadge}>
                        <Ionicons name="construct" size={12} color={THEME.colors.primary} />
                        <Text style={styles.settingText}>Saved Setting: {m.seat_setting}</Text>
                      </View>
                    ) : null}

                    {m.resistance_ratio && m.resistance_ratio !== 1.0 ? (
                      <Text style={styles.ratioText}>Resistance Ratio: {m.resistance_ratio}x</Text>
                    ) : null}
                  </View>

                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                    size={22}
                    color={isSelected ? THEME.colors.primary : THEME.colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })
          )}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: THEME.colors.primaryGlow
  },
  addBtnText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3
  },
  content: {
    padding: 16,
    gap: 14
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1
  },
  addCard: {
    backgroundColor: THEME.colors.surfaceElevated,
    padding: 16,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    gap: 10
  },
  addTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.8
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5
  },
  input: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10
  },
  saveBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4
  },
  saveBtnText: {
    color: '#0A0C10',
    fontWeight: '800',
    fontSize: 14
  },
  machineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 10
  },
  machineCardActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  machineName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  activePill: {
    backgroundColor: THEME.colors.primaryGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  brandText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  settingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4
  },
  settingText: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '600'
  },
  ratioText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  emptySub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center'
  }
});
