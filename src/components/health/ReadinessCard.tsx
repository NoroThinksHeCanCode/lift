import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthMetrics } from '../../types';
import { THEME } from '../../constants/theme';
import { getLatestHealthMetrics } from '../../db/database';
import { syncHealthConnectData, getReadinessAdvice } from '../../services/healthConnect';
import { syncHealthToWidget } from '../../services/widgetService';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

export const ReadinessCard: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    const existing = await getLatestHealthMetrics();
    if (existing) {
      setMetrics(existing);
      await syncHealthToWidget(existing);
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
      await syncHealthToWidget(updated);
      triggerHapticSuccess();
    } catch (e) {
      console.warn('Sync failed:', e);
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
        </View>

        {/* Vertical Divider */}
        <View style={styles.divider} />

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Sleep */}
          <View style={styles.metricItem}>
            <Ionicons name="moon-outline" size={14} color={THEME.colors.cyan} />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.metricVal}>{sleepHrs}h {sleepMins}m</Text>
              <Text style={styles.metricLabel}>Sleep Time</Text>
            </View>
          </View>

          {/* Steps */}
          <View style={styles.metricItem}>
            <Ionicons name="footsteps-outline" size={14} color={THEME.colors.primary} />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.metricVal}>
                {metrics.steps > 999 ? `${(metrics.steps / 1000).toFixed(1)}k` : metrics.steps}
              </Text>
              <Text style={styles.metricLabel}>Daily Steps</Text>
            </View>
          </View>

          {/* Resting HR & HRV */}
          <View style={styles.metricItem}>
            <Ionicons name="heart-outline" size={14} color={THEME.colors.danger} />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.metricVal}>{metrics.restingHeartRate || 54} bpm</Text>
              <Text style={styles.metricLabel}>Resting HR</Text>
            </View>
          </View>

          {/* Sleep Score */}
          <View style={styles.metricItem}>
            <Ionicons name="shield-checkmark-outline" size={14} color={THEME.colors.gold} />
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
    width: 100,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums']
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: THEME.colors.border,
    marginHorizontal: 12
  },
  metricsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 8
  },
  metricItem: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center'
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary
  },
  metricLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 1
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    padding: 10,
    borderRadius: 8,
    gap: 8,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.primary
  },
  adviceText: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16
  }
});
