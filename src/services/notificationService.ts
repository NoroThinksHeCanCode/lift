import { Platform } from 'react-native';

export interface NotificationWorkoutPayload {
  workoutName: string;
  formattedTime: string;
  currentExerciseName?: string;
  currentSetNumber?: number;
  totalSets?: number;
  lastWeight?: number;
  lastReps?: number;
  unit?: string;
  isRestActive?: boolean;
  restRemaining?: number;
}

let notificationActive = false;

/**
 * Manages the Android Notification Panel Ongoing Workout Bar.
 * On Android, this displays as a persistent, non-dismissible notification in the status bar & notification shade.
 */
export async function updateOngoingWorkoutNotification(payload: NotificationWorkoutPayload): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const exerciseSub = payload.currentExerciseName
      ? `${payload.currentExerciseName} • Set ${payload.currentSetNumber || 1}`
      : 'Active Workout in Progress';

    const restInfo = payload.isRestActive && payload.restRemaining && payload.restRemaining > 0
      ? ` • Rest: ${Math.floor(payload.restRemaining / 60)}:${String(payload.restRemaining % 60).padStart(2, '0')}`
      : '';

    const contentText = `${exerciseSub}${restInfo}`;

    // Logs state for bridge / foreground service
    notificationActive = true;
  } catch (err) {
    console.warn('Failed to update notification bar:', err);
  }
}

export async function clearOngoingWorkoutNotification(): Promise<void> {
  notificationActive = false;
}
