import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

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

let notificationPermissionRequested = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Ongoing Workout Notification',
          message: 'Lift needs permission to display your live workout timer, active exercise, and rest countdown in the notification shade.',
          buttonPositive: 'Allow',
          buttonNegative: 'Not Now'
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch (e) {
    console.warn('Failed to request notification permission:', e);
    return false;
  }
}

/**
 * Manages the Android Notification Panel Ongoing Workout Bar.
 * On Android, this displays as a persistent, non-dismissible notification in the status bar & notification shade.
 */
export async function updateOngoingWorkoutNotification(payload: NotificationWorkoutPayload): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    if (!notificationPermissionRequested) {
      notificationPermissionRequested = true;
      requestNotificationPermission().catch(() => {});
    }

    const { LiftNative } = NativeModules;
    if (!LiftNative) return;

    const workoutTitle = `${payload.workoutName} (${payload.formattedTime})`;
    const exercise = payload.currentExerciseName || '';

    let setDetails = `Set ${payload.currentSetNumber || 1}`;
    if (payload.lastWeight && payload.lastWeight > 0) {
      setDetails += ` • Target: ${payload.lastWeight} ${payload.unit || 'lbs'} × ${payload.lastReps || 10} reps`;
    }

    const restInfo = payload.isRestActive && payload.restRemaining && payload.restRemaining > 0
      ? `⏱️ Rest: ${Math.floor(payload.restRemaining / 60)}:${String(payload.restRemaining % 60).padStart(2, '0')}`
      : '';

    LiftNative.updateOngoingWorkoutNotification(
      workoutTitle,
      exercise,
      setDetails,
      restInfo
    );
  } catch (err) {
    console.warn('Failed to update ongoing workout notification:', err);
  }
}

export async function clearOngoingWorkoutNotification(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const { LiftNative } = NativeModules;
    LiftNative?.clearOngoingWorkoutNotification();
  } catch (err) {
    console.warn('Failed to clear ongoing notification:', err);
  }
}
