import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthMetrics } from '../types';

export const WORKOUT_WIDGET_KEY = '@irontrack_widget_active_workout';
export const HEALTH_WIDGET_KEY = '@irontrack_widget_health';

export interface WorkoutWidgetData {
  isActive: boolean;
  workoutName: string;
  elapsedSeconds: number;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  unit: string;
  lastUpdated: number;
  formattedTime?: string;
  restRemaining?: number;
}

export interface HealthWidgetData {
  sleepFormatted: string; // e.g. "7h 42m"
  sleepScore: number;
  readinessScore: number;
  readinessLabel: string;
  stepsFormatted: string; // e.g. "8.4k"
  restingHeartRate: number;
  lastSyncedAt: number;
  advice?: string;
}

/**
 * Broadcasts active workout status to the Android Home Screen Widget.
 */
export async function syncActiveWorkoutToWidget(data: WorkoutWidgetData): Promise<void> {
  try {
    await AsyncStorage.setItem(WORKOUT_WIDGET_KEY, JSON.stringify(data));

    if (Platform.OS === 'android') {
      const { LiftNative } = NativeModules;
      if (LiftNative) {
        const mins = Math.floor(data.elapsedSeconds / 60);
        const secs = data.elapsedSeconds % 60;
        const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const setDetails = data.weight > 0
          ? `Set ${data.setNumber} • ${data.weight} ${data.unit} × ${data.reps} reps`
          : `Set ${data.setNumber} • Ready to lift`;

        const statusPill = data.restRemaining && data.restRemaining > 0
          ? `⏱️ Rest: ${Math.floor(data.restRemaining / 60)}:${String(data.restRemaining % 60).padStart(2, '0')}`
          : '⚡ Open App to Log Sets';

        const payload = JSON.stringify({
          workoutName: data.workoutName,
          formattedTime,
          exerciseName: data.exerciseName || 'Tap to start a session',
          setDetails,
          statusPill,
          isActive: data.isActive
        });

        LiftNative.updateWidgets(payload, null);
      }
    }
  } catch (e) {
    console.warn('Failed to sync workout widget:', e);
  }
}

/**
 * Broadcasts Google Health / Fitbit readiness & sleep metrics to the Android Health Home Screen Widget.
 */
export async function syncHealthToWidget(metrics: HealthMetrics, adviceText?: string): Promise<void> {
  try {
    const hours = Math.floor(metrics.sleepHours);
    const mins = Math.round((metrics.sleepHours - hours) * 60);
    const sleepFormatted = `${hours}h ${mins}m`;

    const widgetData: HealthWidgetData = {
      sleepFormatted,
      sleepScore: metrics.sleepScore ?? 85,
      readinessScore: metrics.readinessScore,
      readinessLabel: metrics.readinessScore >= 85 ? 'Optimal' : metrics.readinessScore >= 70 ? 'Moderate' : 'Low',
      stepsFormatted: metrics.steps > 999 ? `${(metrics.steps / 1000).toFixed(1)}k` : `${metrics.steps}`,
      restingHeartRate: metrics.restingHeartRate ?? 55,
      lastSyncedAt: metrics.lastSyncedAt,
      advice: adviceText
    };

    await AsyncStorage.setItem(HEALTH_WIDGET_KEY, JSON.stringify(widgetData));

    if (Platform.OS === 'android') {
      const { LiftNative } = NativeModules;
      if (LiftNative) {
        const payload = JSON.stringify({
          score: `${metrics.readinessScore}% Readiness`,
          sleep: sleepFormatted,
          steps: metrics.steps.toLocaleString(),
          rhr: `${metrics.restingHeartRate} bpm`,
          advice: adviceText || (metrics.readinessScore >= 85 ? 'Optimal Recovery • Great day for heavy PRs!' : 'Moderate Readiness • Stick to planned volume')
        });

        LiftNative.updateWidgets(null, payload);
      }
    }
  } catch (e) {
    console.warn('Failed to sync health widget:', e);
  }
}
