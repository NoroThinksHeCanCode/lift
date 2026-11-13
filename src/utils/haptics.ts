import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const triggerHapticPR = async () => {
  if (Platform.OS === 'web') return;
  try {
    // Satisfying multi-pulse haptic for PR
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }, 200);
  } catch (err) {
    console.warn('Haptic PR feedback error:', err);
  }
};

export const triggerHapticTimerComplete = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }, 250);
  } catch (err) {
    console.warn('Haptic timer error:', err);
  }
};

export const triggerHapticSelection = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {}
};

export const triggerHapticSuccess = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
};
