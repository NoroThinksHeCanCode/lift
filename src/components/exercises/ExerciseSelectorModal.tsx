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
    const query = search.toLowerCase();
    const matchesSearch =
      ex.name.toLowerCase().includes(query) ||
      ex.equipment.toLowerCase().includes(query) ||
      (ex.joint_action ? ex.joint_action.toLowerCase().includes(query) : false);
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
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Exercise</Text>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={18} color="#000000" />
            <Text style={styles.newBtnText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#737373" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercise, muscle, or joint action..."
            placeholderTextColor="#737373"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#737373" />
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
                  {item.joint_action ? (
                    <View style={styles.jointActionBadge}>
                      <Ionicons name="body-outline" size={10} color="#06B6D4" />
                      <Text style={styles.jointActionText}>{item.joint_action}</Text>
                    </View>
                  ) : null}
                  <Badge label={item.equipment} variant="surface" size="sm" />
                  {item.is_custom === 1 && (
                    <Badge label="CUSTOM" variant="gold" size="sm" />
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#737373" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={48} color="#737373" />
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
    backgroundColor: '#000000'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
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
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: THEME.colors.primary
  },
  newBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 2
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#262626'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 14
  },
  filterBar: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#1C1C1C'
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626'
  },
  filterChipActive: {
    backgroundColor: `${THEME.colors.primary}20`,
    borderColor: THEME.colors.primary
  },
  filterChipText: {
    fontSize: 12,
    color: '#A8A8A8',
    fontWeight: '600'
  },
  filterChipTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700'
  },
  listContent: {
    padding: 16,
    gap: 8
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626'
  },
  itemInfo: {
    flex: 1,
    marginRight: 12
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  jointActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)'
  },
  jointActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06B6D4'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center'
  }
});
