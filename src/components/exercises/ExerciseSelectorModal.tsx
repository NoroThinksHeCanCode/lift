import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, MuscleGroup } from '../../types';
import { THEME } from '../../constants/theme';
import { getAllExercises } from '../../db/database';
import { Badge } from '../common/Badge';
import { CreateExerciseModal } from './CreateExerciseModal';
import { triggerHapticSelection } from '../../utils/haptics';

interface ExerciseSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

const FILTER_GROUPS: (MuscleGroup | 'All')[] = [
  'All', 'Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Glutes', 'Calves'
];

export const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
  visible,
  onClose,
  onSelect
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'All'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = async () => {
    const list = await getAllExercises();
    setExercises(list);
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const filtered = exercises.filter(ex => {
    const matchesGroup = selectedGroup === 'All' || ex.muscle_group === selectedGroup;
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
                          ex.equipment.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handleSelect = (ex: Exercise) => {
    triggerHapticSelection();
    onSelect(ex);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Exercise</Text>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color={THEME.colors.primary} />
            <Text style={styles.newBtnText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={THEME.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises or equipment..."
            placeholderTextColor={THEME.colors.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Muscle Group Filter Chips */}
        <View style={styles.filterBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTER_GROUPS}
            keyExtractor={item => item}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, selectedGroup === item && styles.filterChipActive]}
                onPress={() => {
                  triggerHapticSelection();
                  setSelectedGroup(item);
                }}
              >
                <Text style={[styles.filterChipText, selectedGroup === item && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Exercise List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.exerciseItem}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.tagRow}>
                  <Badge label={item.muscle_group} variant="primary" size="sm" />
                  <Badge label={item.equipment} variant="surface" size="sm" />
                  {item.is_custom === 1 && (
                    <Badge label="CUSTOM" variant="gold" size="sm" />
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={48} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No exercises found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or create a custom one.</Text>
            </View>
          }
        />

        {/* Create Custom Exercise Modal */}
        <CreateExerciseModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newEx) => {
            loadData();
            handleSelect(newEx);
          }}
        />
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
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  closeBtn: {
    padding: 6
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: THEME.colors.primaryGlow
  },
  newBtnText: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 2
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: THEME.colors.textPrimary,
    fontSize: 15
  },
  filterBar: {
    height: 44,
    marginBottom: 4
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center'
  },
  filterChip: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary
  },
  filterChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  filterChipTextActive: {
    color: '#0A0C10'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  itemInfo: {
    flex: 1,
    gap: 6
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center'
  }
});
