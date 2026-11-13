import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WORKOUT_WIDGET_KEY = '@irontrack_widget_active_workout';

export interface WorkoutWidgetData {
  isActive: boolean;
  workoutName: string;
  elapsedSeconds: number;
  exerciseName: string;
  exerciseId?: string;
  setNumber: number;
  weight: number;
  reps: number;
  unit: string;
  lastUpdated: number;
  formattedTime?: string;
  restRemaining?: number;
}

export interface PendingWidgetLog {
  exerciseId: string;
  weight: number;
  reps: number;
  setNumber: number;
  timestamp: number;
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

        const setDetails = `Set ${data.setNumber}`;

        const statusPill = data.restRemaining && data.restRemaining > 0
          ? `⏱️ Rest: ${Math.floor(data.restRemaining / 60)}:${String(data.restRemaining % 60).padStart(2, '0')}`
          : '⚡ Adjust + / – and tap LOG SET';

        const payload = JSON.stringify({
          workoutName: data.workoutName,
          formattedTime,
          exerciseName: data.exerciseName || 'Tap to start a session',
          exerciseId: data.exerciseId || '',
          setNumber: data.setNumber,
          weight: data.weight,
          reps: data.reps,
          unit: data.unit,
          setDetails,
          statusPill,
          isActive: data.isActive
        });

        LiftNative.updateWidgets(payload);
      }
    }
  } catch (e) {
    console.warn('Failed to sync workout widget:', e);
  }
}

/**
 * Retrieves sets logged directly through the home screen widget.
 */
export async function getPendingWidgetLogs(): Promise<PendingWidgetLog[]> {
  if (Platform.OS !== 'android') return [];
  try {
    const { LiftNative } = NativeModules;
    if (LiftNative?.getPendingWidgetLogs) {
      const raw = await LiftNative.getPendingWidgetLogs();
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn('Error reading pending widget logs:', e);
  }
  return [];
}

/**
 * Clears consumed widget logs.
 */
export async function clearPendingWidgetLogs(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const { LiftNative } = NativeModules;
    if (LiftNative?.clearPendingWidgetLogs) {
      await LiftNative.clearPendingWidgetLogs();
    }
  } catch (e) {
    console.warn('Error clearing pending widget logs:', e);
  }
}
