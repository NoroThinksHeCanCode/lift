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
}

export interface HealthWidgetData {
  sleepFormatted: string; // e.g. "7h 42m"
  sleepScore: number;
  readinessScore: number;
  readinessLabel: string;
  stepsFormatted: string; // e.g. "8.4k"
  restingHeartRate: number;
  lastSyncedAt: number;
}

/**
 * Broadcasts active workout status to the Android Home Screen Widget.
 * The widget reads this shared store and exposes inline steppers to increment weight/reps and log sets directly from the home screen!
 */
export async function syncActiveWorkoutToWidget(data: WorkoutWidgetData): Promise<void> {
  try {
    await AsyncStorage.setItem(WORKOUT_WIDGET_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to sync workout widget:', e);
  }
}

/**
 * Broadcasts Google Health / Fitbit readiness & sleep metrics to the Android Health Home Screen Widget.
 */
export async function syncHealthToWidget(metrics: HealthMetrics): Promise<void> {
  try {
    const hours = Math.floor(metrics.sleepHours);
    const mins = Math.round((metrics.sleepHours - hours) * 60);

    const widgetData: HealthWidgetData = {
      sleepFormatted: `${hours}h ${mins}m`,
      sleepScore: metrics.sleepScore || 85,
      readinessScore: metrics.readinessScore,
      readinessLabel: metrics.readinessScore >= 85 ? 'OPTIMAL' : metrics.readinessScore >= 70 ? 'GOOD' : 'REST',
      stepsFormatted: metrics.steps > 999 ? `${(metrics.steps / 1000).toFixed(1)}k` : `${metrics.steps}`,
      restingHeartRate: metrics.restingHeartRate || 54,
      lastSyncedAt: metrics.lastSyncedAt
    };

    await AsyncStorage.setItem(HEALTH_WIDGET_KEY, JSON.stringify(widgetData));
  } catch (e) {
    console.warn('Failed to sync health widget:', e);
  }
}

export async function getWidgetWorkoutState(): Promise<WorkoutWidgetData | null> {
  try {
    const str = await AsyncStorage.getItem(WORKOUT_WIDGET_KEY);
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}
