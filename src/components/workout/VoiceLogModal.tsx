import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { useSettings } from '../../context/SettingsContext';
import { VoiceLoggerService, parseGymSpeech, ParsedGymSpeech } from '../../services/voiceLogger';
import { triggerHapticSelection, triggerHapticSuccess } from '../../utils/haptics';

interface VoiceLogModalProps {
  visible: boolean;
  onClose: () => void;
  targetExerciseId?: string;
}

export const VoiceLogModal: React.FC<VoiceLogModalProps> = ({
  visible,
  onClose,
  targetExerciseId: initialTargetId
}) => {
  const { activeExercises, updateSet, toggleSetCompleted } = useWorkout();
  const { settings } = useSettings();

  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedGymSpeech | null>(null);
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('Tap the mic and speak your set...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Determine target exercise: prefer prop, or first uncompleted exercise, or first exercise
  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      setLiveTranscript('');
      setParsedResult(null);

      let targetId = initialTargetId;
      if (!targetId && activeExercises.length > 0) {
        // Find first exercise that has an uncompleted set
        const firstUncompleted = activeExercises.find(ex => ex.sets.some(s => !s.is_completed));
        targetId = firstUncompleted ? firstUncompleted.exercise.id : activeExercises[0].exercise.id;
      }
      setSelectedExId(targetId || '');

      // Start listening automatically on modal open
      startRecording(targetId);
    } else {
      stopRecording();
    }
  }, [visible]);

  const startPulseAnimation = () => {
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        })
      ])
    );
    pulseLoopRef.current.start();
  };

  const stopPulseAnimation = () => {
    pulseLoopRef.current?.stop();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }).start();
  };

  const startRecording = async (targetId?: string) => {
    const service = VoiceLoggerService.getInstance();
    const hasPerm = await service.requestMicrophonePermission();
    if (!hasPerm) {
      setErrorMessage('Microphone permission denied. Enable in Settings.');
      return;
    }

    setErrorMessage(null);
    setLiveTranscript('');
    setParsedResult(null);
    setIsListening(true);
    setStatusMessage('Listening... (e.g. "225 for 8" or "10 reps at 80")');
    startPulseAnimation();
    triggerHapticSelection();

    try {
      await service.startListening({
        onReady: () => {
          setStatusMessage('Listening... speak now');
        },
        onBeginning: () => {
          setStatusMessage('Hearing you...');
        },
        onPartialResults: (text) => {
          setLiveTranscript(text);
          processSpeechText(text, targetId);
        },
        onResults: (text) => {
          setLiveTranscript(text);
          setIsListening(false);
          stopPulseAnimation();
          processSpeechText(text, targetId);
        },
        onError: (err) => {
          setIsListening(false);
          stopPulseAnimation();
          setErrorMessage(err || 'Could not recognize speech. Try again.');
        },
        onEnd: () => {
          setIsListening(false);
          stopPulseAnimation();
        }
      });
    } catch (e: any) {
      setIsListening(false);
      stopPulseAnimation();
      setErrorMessage(e.message || 'Speech recognition failed to start');
    }
  };

  const stopRecording = async () => {
    setIsListening(false);
    stopPulseAnimation();
    await VoiceLoggerService.getInstance().stopListening();
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording(selectedExId);
    }
  };

  const processSpeechText = (text: string, currentTargetId?: string) => {
    const activeEx = activeExercises.find(e => e.exercise.id === (currentTargetId || selectedExId));
    const lastCompletedSet = activeEx?.sets.filter(s => s.is_completed).slice(-1)[0];
    const firstUncompletedSet = activeEx?.sets.find(s => !s.is_completed);

    const fallbackWeight = firstUncompletedSet?.weight || lastCompletedSet?.weight || 0;
    const fallbackReps = firstUncompletedSet?.reps || lastCompletedSet?.reps || 10;

    const availableNames = activeExercises.map(e => ({ id: e.exercise.id, name: e.exercise.name }));
    const parsed = parseGymSpeech(text, settings.unit, fallbackWeight, fallbackReps, availableNames);

    if (parsed.matchedExerciseId) {
      setSelectedExId(parsed.matchedExerciseId);
    }

    setParsedResult(parsed);
  };

  const handleApplyLog = async () => {
    if (!parsedResult || parsedResult.weight === null || parsedResult.reps === null) {
      Alert.alert('Incomplete Set', 'Could not detect valid weight or reps. Please try speaking again.');
      return;
    }

    const exId = parsedResult.matchedExerciseId || selectedExId;
    const activeEx = activeExercises.find(e => e.exercise.id === exId);
    if (!activeEx) {
      Alert.alert('Error', 'Target exercise not found in workout.');
      return;
    }

    // Find the next uncompleted set, or target the last set
    const targetSet = activeEx.sets.find(s => !s.is_completed) || activeEx.sets[activeEx.sets.length - 1];
    if (!targetSet) return;

    triggerHapticSuccess();

    // 1. Update set weight, reps, and RPE
    updateSet(exId, targetSet.id, {
      weight: parsedResult.weight,
      reps: parsedResult.reps,
      rpe: parsedResult.rpe || targetSet.rpe
    });

    // 2. Complete the set (triggers PR check, audio/haptic feedback, and auto-rest timer)
    await toggleSetCompleted(exId, targetSet.id);

    // Close modal
    onClose();
  };

  const currentExercise = activeExercises.find(e => e.exercise.id === selectedExId) || activeExercises[0];
  const nextSet = currentExercise?.sets.find(s => !s.is_completed) || currentExercise?.sets[0];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="mic" size={18} color={THEME.colors.primary} />
              <Text style={styles.headerTitle}>VOICE LOG SET</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#737373" />
            </TouchableOpacity>
          </View>

          {/* Target Exercise Selector */}
          {activeExercises.length > 0 && (
            <View style={styles.exerciseSelectorRow}>
              <Text style={styles.selectorLabel}>TARGET EXERCISE:</Text>
              <View style={styles.exercisePillsWrap}>
                {activeExercises.map(ex => {
                  const isSelected = ex.exercise.id === selectedExId;
                  return (
                    <TouchableOpacity
                      key={ex.exercise.id}
                      style={[styles.exercisePill, isSelected && styles.exercisePillActive]}
                      onPress={() => {
                        triggerHapticSelection();
                        setSelectedExId(ex.exercise.id);
                        if (liveTranscript) {
                          processSpeechText(liveTranscript, ex.exercise.id);
                        }
                      }}
                    >
                      <Text
                        style={[styles.exercisePillText, isSelected && styles.exercisePillTextActive]}
                        numberOfLines={1}
                      >
                        {ex.exercise.name} (Set {ex.sets.findIndex(s => !s.is_completed) + 1 || ex.sets.length})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Central Pulsing Microphone Indicator */}
          <View style={styles.micArea}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleListening}
              style={styles.micOuterCircle}
            >
              <Animated.View
                style={[
                  styles.pulseRing,
                  isListening && styles.pulseRingActive,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              />
              <View style={[styles.micCenterBtn, isListening && styles.micCenterBtnActive]}>
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={36}
                  color={isListening ? '#000000' : THEME.colors.primary}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={THEME.colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Live Heard Transcript */}
          {liveTranscript ? (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>YOU SAID:</Text>
              <Text style={styles.transcriptText}>"{liveTranscript}"</Text>
            </View>
          ) : null}

          {/* Parsed Result Preview */}
          {parsedResult && parsedResult.weight !== null && parsedResult.reps !== null ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={16} color={THEME.colors.primary} />
                <Text style={styles.resultHeading}>DETECTED SET DATA</Text>
              </View>

              <View style={styles.statsPreviewRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillLabel}>WEIGHT</Text>
                  <Text style={styles.statPillValue}>
                    {parsedResult.weight} {settings.unit}
                  </Text>
                </View>

                <View style={styles.statPill}>
                  <Text style={styles.statPillLabel}>REPS</Text>
                  <Text style={styles.statPillValue}>
                    {parsedResult.reps} reps
                  </Text>
                </View>

                {parsedResult.rpe ? (
                  <View style={styles.statPill}>
                    <Text style={styles.statPillLabel}>RPE</Text>
                    <Text style={styles.statPillValue}>
                      @{parsedResult.rpe}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Bottom Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.logBtn,
                (!parsedResult || parsedResult.weight === null || parsedResult.reps === null) && styles.logBtnDisabled
              ]}
              disabled={!parsedResult || parsedResult.weight === null || parsedResult.reps === null}
              onPress={handleApplyLog}
            >
              <Ionicons name="checkmark" size={18} color="#000000" />
              <Text style={styles.logBtnText}>LOG SET</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#262626'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#1F1F1F',
    paddingBottom: 10
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1
  },
  closeBtn: {
    padding: 4
  },
  exerciseSelectorRow: {
    marginBottom: 14
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#737373',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  exercisePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  exercisePill: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E'
  },
  exercisePillActive: {
    backgroundColor: `${THEME.colors.primary}20`,
    borderColor: THEME.colors.primary
  },
  exercisePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A8A8A8'
  },
  exercisePillTextActive: {
    color: THEME.colors.primary,
    fontWeight: '800'
  },
  micArea: {
    alignItems: 'center',
    paddingVertical: 14
  },
  micOuterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  pulseRingActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)'
  },
  micCenterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.primary
  },
  micCenterBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: '#FFFFFF'
  },
  statusText: {
    fontSize: 13,
    color: '#A8A8A8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 12
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.danger,
    fontWeight: '600',
    flex: 1
  },
  transcriptBox: {
    backgroundColor: '#171717',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626'
  },
  transcriptLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#737373',
    letterSpacing: 0.8,
    marginBottom: 2
  },
  transcriptText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontStyle: 'italic'
  },
  resultCard: {
    backgroundColor: '#14181F',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)'
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  resultHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: 0.8
  },
  statsPreviewRow: {
    flexDirection: 'row',
    gap: 8
  },
  statPill: {
    flex: 1,
    backgroundColor: '#1E232B',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C3542'
  },
  statPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  statPillValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2E2E2E'
  },
  cancelBtnText: {
    color: '#A8A8A8',
    fontWeight: '700',
    fontSize: 13
  },
  logBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  logBtnDisabled: {
    opacity: 0.4
  },
  logBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.8
  }
});
