import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthMetrics } from '../../types';
import { THEME } from '../../constants/theme';
import { getLatestHealthMetrics } from '../../db/database';
import { syncHealthConnectData, getReadinessAdvice, openHealthConnectPermissions } from '../../services/healthConnect';
import { syncHealthToWidget } from '../../services/widgetService';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

export const ReadinessCard: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Edit form state
  const [sleepHoursInput, setSleepHoursInput] = useState('7.8');
  const [sleepScoreInput, setSleepScoreInput] = useState('88');
  const [restingHRInput, setRestingHRInput] = useState('52');
  const [stepsInput, setStepsInput] = useState('8940');

  const loadData = async () => {
    const existing = await getLatestHealthMetrics();
    if (existing) {
      setMetrics(existing);
      setSleepHoursInput(String(existing.sleepHours));
      setSleepScoreInput(String(existing.sleepScore));
      setRestingHRInput(String(existing.restingHeartRate));
      setStepsInput(String(existing.steps));
      const advice = getReadinessAdvice(existing.readinessScore).advice;
      await syncHealthToWidget(existing, advice);
    } else {
      handleSync();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    triggerHapticSelection();
    setSyncing(true);
    try {
      const updated = await syncHealthConnectData();
      setMetrics(updated);
      setSleepHoursInput(String(updated.sleepHours));
      setSleepScoreInput(String(updated.sleepScore));
      setRestingHRInput(String(updated.restingHeartRate));
      setStepsInput(String(updated.steps));
      triggerHapticSuccess();
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenPermissions = async () => {
    triggerHapticSelection();
    await openHealthConnectPermissions();
  };

  const handleSaveManualMetrics = async () => {
    triggerHapticSuccess();
    setSyncing(true);
    try {
      const hours = parseFloat(sleepHoursInput) || 7.5;
      const score = parseInt(sleepScoreInput, 10) || 85;
      const rhr = parseInt(restingHRInput, 10) || 55;
      const steps = parseInt(stepsInput, 10) || 8000;

      const updated = await syncHealthConnectData({
        sleepHours: hours,
        sleepScore: score,
        restingHeartRate: rhr,
        steps: steps,
        hrvMs: rhr <= 55 ? 68 : 50
      });

      setMetrics(updated);
      setEditModalVisible(false);
    } catch (e) {
      console.warn('Manual save failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  if (!metrics) return null;

  const advice = getReadinessAdvice(metrics.readinessScore);
  const sleepHrs = Math.floor(metrics.sleepHours);
  const sleepMins = Math.round((metrics.sleepHours - sleepHrs) * 60);

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.sourceTag}>
          <Ionicons name="fitness" size={14} color={THEME.colors.primary} />
          <Text style={styles.sourceText}>FITBIT • GOOGLE HEALTH</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={13} color={THEME.colors.textMuted} />
            <Text style={styles.iconBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleOpenPermissions} style={styles.iconBtn}>
            <Ionicons name="shield-checkmark-outline" size={13} color={THEME.colors.primary} />
            <Text style={[styles.iconBtnText, { color: THEME.colors.primary }]}>Permissions</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSync} disabled={syncing} style={styles.syncBtn}>
            {syncing ? (
              <ActivityIndicator size="small" color={THEME.colors.primary} />
            ) : (
              <>
                <Ionicons name="sync" size={12} color={THEME.colors.textMuted} />
                <Text style={styles.syncText}>Sync</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Stats Row */}
      <View style={styles.statsRow}>
        {/* Readiness Score */}
        <View style={styles.readinessBox}>
          <Text style={styles.scoreNumber}>{metrics.readinessScore}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${advice.color}20` }]}>
            <Text style={[styles.statusBadgeText, { color: advice.color }]}>
              {advice.label.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.readinessSub}>READINESS SCORE</Text>
        </View>

        {/* Supporting Metrics */}
        <View style={styles.metricsGrid}>
          {/* Sleep */}
          <View style={styles.metricItem}>
            <Ionicons name="moon-outline" size={13} color="#818CF8" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.metricVal}>{sleepHrs}h {sleepMins}m</Text>
              <Text style={styles.metricLabel}>Sleep Time</Text>
            </View>
          </View>

          {/* Resting HR */}
          <View style={styles.metricItem}>
            <Ionicons name="heart-outline" size={13} color="#F43F5E" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.metricVal}>{metrics.restingHeartRate} bpm</Text>
              <Text style={styles.metricLabel}>Resting HR</Text>
            </View>
          </View>

          {/* Steps */}
          <View style={styles.metricItem}>
            <Ionicons name="footsteps-outline" size={13} color="#10B981" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.metricVal}>{metrics.steps.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Daily Steps</Text>
            </View>
          </View>

          {/* Sleep Quality */}
          <View style={styles.metricItem}>
            <Ionicons name="pulse-outline" size={13} color="#F59E0B" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.metricVal}>{metrics.sleepScore || 85}%</Text>
              <Text style={styles.metricLabel}>Sleep Quality</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Training Recommendation */}
      <View style={styles.adviceBox}>
        <Ionicons name="sparkles" size={14} color={advice.color} />
        <Text style={styles.adviceText}>{advice.advice}</Text>
      </View>

      {/* Manual / Fitbit Metric Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Fitbit &amp; Health Metrics</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={20} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDesc}>
                Adjust or sync your metrics directly. Changes immediately update your Readiness Score and Android Home Screen Widget.
              </Text>

              {/* Sleep Hours */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>SLEEP DURATION (HOURS)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={sleepHoursInput}
                  onChangeText={setSleepHoursInput}
                  placeholder="e.g. 7.5"
                  placeholderTextColor={THEME.colors.textMuted}
                />
              </View>

              {/* Sleep Score */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>SLEEP QUALITY SCORE (0–100)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="number-pad"
                  value={sleepScoreInput}
                  onChangeText={setSleepScoreInput}
                  placeholder="e.g. 88"
                  placeholderTextColor={THEME.colors.textMuted}
                />
              </View>

              {/* Resting HR */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>RESTING HEART RATE (BPM)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="number-pad"
                  value={restingHRInput}
                  onChangeText={setRestingHRInput}
                  placeholder="e.g. 52"
                  placeholderTextColor={THEME.colors.textMuted}
                />
              </View>

              {/* Steps */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>DAILY STEPS</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="number-pad"
                  value={stepsInput}
                  onChangeText={setStepsInput}
                  placeholder="e.g. 8940"
                  placeholderTextColor={THEME.colors.textMuted}
                />
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveManualMetrics}>
                  <Text style={styles.saveBtnText}>Update Readiness</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 12
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  iconBtnText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600'
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  syncText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  readinessBox: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
    paddingRight: 12
  },
  scoreNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums']
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  readinessSub: {
    fontSize: 8,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5
  },
  metricsGrid: {
    flex: 1,
    paddingLeft: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  metricItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center'
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  metricLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.surfaceElevated,
    padding: 10,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  adviceText: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.textPrimary,
    lineHeight: 15
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  modalDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: 16
  },
  inputRow: {
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textMuted
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center'
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000'
  }
});
