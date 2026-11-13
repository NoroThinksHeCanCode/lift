import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthMetrics } from '../../types';
import { THEME } from '../../constants/theme';
import { getLatestHealthMetrics } from '../../db/database';
import { syncHealthConnectData, getReadinessAdvice, openHealthConnectSettings } from '../../services/healthConnect';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

export const ReadinessCard: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    const existing = await getLatestHealthMetrics();
    if (existing) {
      setMetrics(existing);
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
    setStatusMessage(null);
    try {
      const result = await syncHealthConnectData();
      setMetrics(result.metrics);
      setStatusMessage(result.message);
      triggerHapticSuccess();
    } catch (e: any) {
      console.warn('Sync failed:', e);
      setStatusMessage('Sync failed. Please check Health Connect.');
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
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.sourceTag}>
          <Ionicons name="fitness" size={13} color={THEME.colors.primary} />
          <Text style={styles.sourceText} numberOfLines={1}>FITBIT • GOOGLE HEALTH</Text>
        </View>

        <TouchableOpacity
          onPress={handleSync}
          disabled={syncing}
          style={styles.syncBtn}
          activeOpacity={0.7}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={THEME.colors.primary} />
          ) : (
            <>
              <Ionicons name="sync" size={12} color={THEME.colors.primary} />
              <Text style={styles.syncText}>Sync</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Readiness Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>{metrics.readinessScore}</Text>
          <Text style={styles.scoreUnit}>%</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${advice.color}20` }]}>
            <Text style={[styles.statusBadgeText, { color: advice.color }]}>
              {advice.label.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.readinessSub}>TRAINING READINESS</Text>
      </View>

      {/* 2x2 Clean Responsive Metrics Grid */}
      <View style={styles.tilesContainer}>
        {/* Tile 1: Sleep Duration */}
        <View style={styles.metricTile}>
          <View style={styles.tileHeader}>
            <Ionicons name="moon-outline" size={13} color="#818CF8" />
            <Text style={styles.tileLabel}>SLEEP TIME</Text>
          </View>
          <Text style={styles.tileValue} numberOfLines={1}>{sleepHrs}h {sleepMins}m</Text>
        </View>

        {/* Tile 2: Resting HR */}
        <View style={styles.metricTile}>
          <View style={styles.tileHeader}>
            <Ionicons name="heart-outline" size={13} color="#F43F5E" />
            <Text style={styles.tileLabel}>RESTING HR</Text>
          </View>
          <Text style={styles.tileValue} numberOfLines={1}>{metrics.restingHeartRate} bpm</Text>
        </View>

        {/* Tile 3: Daily Steps */}
        <View style={styles.metricTile}>
          <View style={styles.tileHeader}>
            <Ionicons name="footsteps-outline" size={13} color="#10B981" />
            <Text style={styles.tileLabel}>DAILY STEPS</Text>
          </View>
          <Text style={styles.tileValue} numberOfLines={1}>{metrics.steps.toLocaleString()}</Text>
        </View>

        {/* Tile 4: Sleep Score */}
        <View style={styles.metricTile}>
          <View style={styles.tileHeader}>
            <Ionicons name="pulse-outline" size={13} color="#F59E0B" />
            <Text style={styles.tileLabel}>SLEEP SCORE</Text>
          </View>
          <Text style={styles.tileValue} numberOfLines={1}>{metrics.sleepScore || 85}%</Text>
        </View>
      </View>

      {/* Recommendation Banner */}
      <View style={styles.adviceBox}>
        <Ionicons name="sparkles" size={14} color={advice.color} style={{ marginTop: 1 }} />
        <Text style={styles.adviceText}>{advice.advice}</Text>
      </View>

      {/* Sync Status Feedback */}
      {statusMessage && (
        <View style={styles.statusRow}>
          <Text style={styles.statusMessageText} numberOfLines={1}>
            {statusMessage}
          </Text>
          <TouchableOpacity onPress={openHealthConnectSettings} style={styles.settingsLink}>
            <Text style={styles.settingsLinkText}>Settings</Text>
            <Ionicons name="chevron-forward" size={10} color={THEME.colors.primary} />
          </TouchableOpacity>
        </View>
      )}
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
    gap: 12,
    width: '100%'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  syncText: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '700'
  },
  heroSection: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums']
  },
  scoreUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginRight: 6
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  readinessSub: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between'
  },
  metricTile: {
    width: '48.5%',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: THEME.colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle
  },
  adviceText: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.textPrimary,
    lineHeight: 16
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4
  },
  statusMessageText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    flex: 1
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 8
  },
  settingsLinkText: {
    fontSize: 10,
    color: THEME.colors.primary,
    fontWeight: '700'
  }
});
