import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, MuscleGroup } from '../types';
import { THEME } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import {
  getAllExercises,
  getExerciseProgress,
  ExerciseProgressPoint
} from '../db/database';
import { Badge } from '../components/common/Badge';
import { LineChart } from '../components/charts/LineChart';
import { CreateExerciseModal } from '../components/exercises/CreateExerciseModal';
import { triggerHapticSelection } from '../utils/haptics';

const FILTER_GROUPS: (MuscleGroup | 'All')[] = [
  'All', 'Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Glutes', 'Calves'
];

export const ExercisesScreen: React.FC = () => {
  const { settings } = useSettings();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'All'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Exercise Detail Modal
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [progressData, setProgressData] = useState<ExerciseProgressPoint[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const loadData = async () => {
    const list = await getAllExercises();
    setExercises(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openExerciseDetail = async (ex: Exercise) => {
    triggerHapticSelection();
    setSelectedExercise(ex);
    setLoadingProgress(true);
    try {
      const data = await getExerciseProgress(ex.id);
      setProgressData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProgress(false);
    }
  };

  const filtered = exercises.filter(ex => {
    const matchesGroup = selectedGroup === 'All' || ex.muscle_group === selectedGroup;
    const query = search.toLowerCase();
    const matchesSearch =
      ex.name.toLowerCase().includes(query) ||
      ex.equipment.toLowerCase().includes(query) ||
      (ex.joint_action ? ex.joint_action.toLowerCase().includes(query) : false);
    return matchesGroup && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>EXERCISE DATABASE</Text>
          <Text style={styles.headerTitle}>Exercises & Stats</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            triggerHapticSelection();
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={18} color="#0A0C10" />
          <Text style={styles.addBtnText}>Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={THEME.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, muscle, or equipment..."
          placeholderTextColor={THEME.colors.textMuted}
          value={search}
          onChangeText={setSearch}
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

      {/* Exercises List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.exerciseCard}
            onPress={() => openExerciseDetail(item)}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <View style={styles.badgesRow}>
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

            <View style={styles.cardRight}>
              <Ionicons name="stats-chart" size={16} color={THEME.colors.primary} />
              <Ionicons name="chevron-forward" size={16} color={THEME.colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Exercise Detail & Charts Modal */}
      <Modal
        visible={selectedExercise !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedExercise(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedExercise(null)} style={{ padding: 6 }}>
              <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {selectedExercise?.name}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {selectedExercise && (
              <View style={styles.badgesRow}>
                <Badge label={selectedExercise.muscle_group} variant="primary" size="md" />
                {selectedExercise.joint_action ? (
                  <View style={styles.jointActionBadgeMd}>
                    <Ionicons name="body-outline" size={12} color="#06B6D4" />
                    <Text style={styles.jointActionTextMd}>{selectedExercise.joint_action}</Text>
                  </View>
                ) : null}
                <Badge label={selectedExercise.equipment} variant="surface" size="md" />
                {selectedExercise.is_custom === 1 && (
                  <Badge label="CUSTOM EXERCISE" variant="gold" size="md" />
                )}
              </View>
            )}

            {loadingProgress ? (
              <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginTop: 40 }} />
            ) : progressData.length === 0 ? (
              <View style={styles.emptyProgressBox}>
                <Ionicons name="trending-up-outline" size={48} color={THEME.colors.textMuted} />
                <Text style={styles.emptyProgressTitle}>No Lift History Yet</Text>
                <Text style={styles.emptyProgressSub}>
                  Log sets of {selectedExercise?.name} during a workout to track progression graphs and PRs!
                </Text>
              </View>
            ) : (
              <>
                {/* All Time Bests Grid */}
                <View style={styles.prsGrid}>
                  <View style={styles.prStatBox}>
                    <Text style={styles.prStatValue}>
                      {Math.max(...progressData.map(d => d.maxWeight))} {settings.unit}
                    </Text>
                    <Text style={styles.prStatLabel}>MAX WEIGHT</Text>
                  </View>

                  <View style={styles.prStatBox}>
                    <Text style={styles.prStatValue}>
                      {Math.max(...progressData.map(d => d.bestEstimated1RM))} {settings.unit}
                    </Text>
                    <Text style={styles.prStatLabel}>ESTIMATED 1RM</Text>
                  </View>
                </View>

                {/* 1RM Progression Chart */}
                <LineChart
                  title="ESTIMATED 1RM PROGRESSION OVER TIME"
                  unit={settings.unit}
                  strokeColor={THEME.colors.primary}
                  data={progressData.map(d => ({
                    xLabel: d.date.substring(5), // MM-DD
                    value: d.bestEstimated1RM
                  }))}
                />

                {/* Max Weight Lifted Chart */}
                <LineChart
                  title="MAX WEIGHT LIFTED PER SESSION"
                  unit={settings.unit}
                  strokeColor={THEME.colors.cyan}
                  data={progressData.map(d => ({
                    xLabel: d.date.substring(5),
                    value: d.maxWeight
                  }))}
                />

                {/* Total Volume per session Chart */}
                <LineChart
                  title="TOTAL VOLUME TONNAGE PER SESSION"
                  unit={settings.unit}
                  strokeColor={THEME.colors.gold}
                  data={progressData.map(d => ({
                    xLabel: d.date.substring(5),
                    value: d.totalVolume
                  }))}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Custom Exercise Modal */}
      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => loadData()}
      />
    </View>
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
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 1.2
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginTop: 2
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  addBtnText: {
    color: '#0A0C10',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4
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
    paddingBottom: 120,
    gap: 8
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
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
  jointActionBadgeMd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  jointActionTextMd: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06B6D4'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    flex: 1,
    textAlign: 'center'
  },
  modalContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40
  },
  prsGrid: {
    flexDirection: 'row',
    gap: 12
  },
  prStatBox: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  prStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.colors.gold
  },
  prStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 4
  },
  emptyProgressBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 10,
    marginTop: 20
  },
  emptyProgressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  emptyProgressSub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18
  }
});
