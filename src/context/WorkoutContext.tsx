import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  ActiveExerciseSession,
  Exercise,
  MachineVariant,
  OverloadPrompt,
  PRNotification,
  SetType,
  Workout,
  WorkoutSet
} from '../types';
import {
  checkPersonalRecord,
  getPreviousSetsForExercise,
  saveCompletedWorkout
} from '../db/database';
import { triggerHapticPR, triggerHapticTimerComplete, triggerHapticSuccess } from '../utils/haptics';
import { useSettings } from './SettingsContext';
import { updateOngoingWorkoutNotification, clearOngoingWorkoutNotification } from '../services/notificationService';
import { syncActiveWorkoutToWidget, WorkoutWidgetData } from '../services/widgetService';

interface WorkoutContextValue {
  isWorkoutActive: boolean;
  activeWorkout: Workout | null;
  activeExercises: ActiveExerciseSession[];
  isWorkoutModalVisible: boolean;
  setIsWorkoutModalVisible: (visible: boolean) => void;

  startWorkout: (name?: string, templateId?: string, initialExercises?: { exercise: Exercise; target_sets: number }[]) => Promise<void>;
  finishWorkout: (notes?: string) => Promise<void>;
  cancelWorkout: () => void;
  addExerciseToWorkout: (exercise: Exercise, machine?: MachineVariant) => Promise<void>;
  removeExerciseFromWorkout: (exerciseId: string) => void;
  setExerciseMachine: (exerciseId: string, machine: MachineVariant) => Promise<void>;
  setExerciseCustomRest: (exerciseId: string, seconds: number) => void;
  setExerciseTargetRepRange: (exerciseId: string, min: number, max: number) => void;
  applyOverloadIncrease: (exerciseId: string, newWeight: number) => void;
  addSet: (exerciseId: string, setType?: SetType) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  toggleSetCompleted: (exerciseId: string, setId: string) => Promise<void>;

  elapsedSeconds: number;
  formattedWorkoutTime: string;

  restRemaining: number;
  restTotal: number;
  isRestTimerActive: boolean;
  startRestTimer: (seconds?: number) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  adjustRestTimer: (delta: number) => void;
  stopRestTimer: () => void;

  currentPRNotification: PRNotification | null;
  dismissPRNotification: () => void;

  currentOverloadPrompt: OverloadPrompt | null;
  dismissOverloadPrompt: () => void;
}

const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();

  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [activeExercises, setActiveExercises] = useState<ActiveExerciseSession[]>([]);
  const [isWorkoutModalVisible, setIsWorkoutModalVisible] = useState<boolean>(false);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const workoutStartRef = useRef<number | null>(null);

  const [restRemaining, setRestRemaining] = useState<number>(0);
  const [restTotal, setRestTotal] = useState<number>(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const restTimerEndRef = useRef<number | null>(null);

  const [currentPRNotification, setCurrentPRNotification] = useState<PRNotification | null>(null);
  const [currentOverloadPrompt, setCurrentOverloadPrompt] = useState<OverloadPrompt | null>(null);

  const syncExternalBridges = (timeSeconds: number, exercisesList: ActiveExerciseSession[], currentRest: number) => {
    if (!activeWorkout) return;

    let currentExName = 'Lift Workout Active';
    let currentSetNum = 1;
    let nextWeight = 0;
    let nextReps = 10;

    for (const exSession of exercisesList) {
      const incomplete = exSession.sets.find(s => !s.is_completed);
      if (incomplete) {
        currentExName = exSession.selectedMachine
          ? `${exSession.exercise.name} (${exSession.selectedMachine.name})`
          : exSession.exercise.name;
        currentSetNum = incomplete.set_number;
        nextWeight = incomplete.weight;
        nextReps = incomplete.reps;
        break;
      }
    }

    const formattedTime = formatTimer(timeSeconds);

    updateOngoingWorkoutNotification({
      workoutName: activeWorkout.name,
      formattedTime,
      currentExerciseName: currentExName,
      currentSetNumber: currentSetNum,
      isRestActive: isRestTimerActive,
      restRemaining: currentRest,
      unit: settings.unit
    });

    const widgetData: WorkoutWidgetData = {
      isActive: true,
      workoutName: activeWorkout.name,
      elapsedSeconds: timeSeconds,
      exerciseName: currentExName,
      setNumber: currentSetNum,
      weight: nextWeight,
      reps: nextReps,
      unit: settings.unit,
      lastUpdated: Date.now()
    };
    syncActiveWorkoutToWidget(widgetData);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (activeWorkout) {
      if (!workoutStartRef.current) {
        workoutStartRef.current = activeWorkout.start_time;
      }
      interval = setInterval(() => {
        if (workoutStartRef.current) {
          const diff = Math.floor((Date.now() - workoutStartRef.current) / 1000);
          setElapsedSeconds(diff);
          syncExternalBridges(diff, activeExercises, restRemaining);
        }
      }, 1000);
    } else {
      workoutStartRef.current = null;
      setElapsedSeconds(0);
      clearOngoingWorkoutNotification();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeWorkout, activeExercises, restRemaining, isRestTimerActive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRestTimerActive && restTimerEndRef.current) {
      interval = setInterval(() => {
        if (restTimerEndRef.current) {
          const remaining = Math.max(0, Math.ceil((restTimerEndRef.current - Date.now()) / 1000));
          setRestRemaining(remaining);
          if (remaining <= 0) {
            setIsRestTimerActive(false);
            restTimerEndRef.current = null;
            if (settings.hapticsEnabled) {
              triggerHapticTimerComplete();
            }
          }
        }
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRestTimerActive, settings.hapticsEnabled]);

  const startRestTimer = (seconds?: number) => {
    const total = seconds || settings.defaultRestSeconds;
    setRestTotal(total);
    setRestRemaining(total);
    restTimerEndRef.current = Date.now() + total * 1000;
    setIsRestTimerActive(true);
  };

  const pauseRestTimer = () => {
    setIsRestTimerActive(false);
  };

  const resumeRestTimer = () => {
    if (restRemaining > 0) {
      restTimerEndRef.current = Date.now() + restRemaining * 1000;
      setIsRestTimerActive(true);
    }
  };

  const adjustRestTimer = (delta: number) => {
    const newRemaining = Math.max(0, restRemaining + delta);
    setRestRemaining(newRemaining);
    if (newRemaining > restTotal) {
      setRestTotal(newRemaining);
    }
    if (isRestTimerActive) {
      restTimerEndRef.current = Date.now() + newRemaining * 1000;
    }
  };

  const stopRestTimer = () => {
    setIsRestTimerActive(false);
    setRestRemaining(0);
    restTimerEndRef.current = null;
  };

  const startWorkout = async (
    name?: string,
    templateId?: string,
    initialExercises?: { exercise: Exercise; target_sets: number }[]
  ) => {
    const workoutId = `workout_${Date.now()}`;
    const startTime = Date.now();
    workoutStartRef.current = startTime;

    const newWorkout: Workout = {
      id: workoutId,
      name: name || `Workout • ${new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`,
      start_time: startTime,
      duration_seconds: 0,
      template_id: templateId
    };

    const seededSessions: ActiveExerciseSession[] = [];

    if (initialExercises && initialExercises.length > 0) {
      for (const item of initialExercises) {
        const defaultMachine = item.exercise.machines?.find(m => m.is_default) || item.exercise.machines?.[0];
        const prevSets = await getPreviousSetsForExercise(item.exercise.id, defaultMachine?.id);
        const sets: WorkoutSet[] = [];
        const count = item.target_sets || 3;

        for (let i = 1; i <= count; i++) {
          const prev = prevSets[i - 1];
          sets.push({
            id: `set_${workoutId}_${item.exercise.id}_${i}`,
            workout_id: workoutId,
            exercise_id: item.exercise.id,
            set_number: i,
            set_type: prev?.set_type || 'normal',
            weight: prev ? prev.weight : 0,
            reps: prev ? prev.reps : 10,
            rpe: prev?.rpe,
            is_completed: false,
            is_pr: false,
            machine_id: defaultMachine?.id,
            machine_name: defaultMachine?.name,
            machine_settings: defaultMachine?.seat_setting
          });
        }

        seededSessions.push({
          exercise: item.exercise,
          selectedMachine: defaultMachine,
          targetRepsMin: 8,
          targetRepsMax: 12,
          sets,
          previousSets: prevSets
        });
      }
    }

    setActiveWorkout(newWorkout);
    setActiveExercises(seededSessions);
    setIsWorkoutModalVisible(true);
  };

  const addExerciseToWorkout = async (exercise: Exercise, machine?: MachineVariant) => {
    if (!activeWorkout) return;
    const chosenMachine = machine || exercise.machines?.find(m => m.is_default) || exercise.machines?.[0];
    const prevSets = await getPreviousSetsForExercise(exercise.id, chosenMachine?.id);
    const initialWeight = prevSets.length > 0 ? prevSets[0].weight : 0;
    const initialReps = prevSets.length > 0 ? prevSets[0].reps : 10;

    const initialSet: WorkoutSet = {
      id: `set_${activeWorkout.id}_${exercise.id}_1`,
      workout_id: activeWorkout.id,
      exercise_id: exercise.id,
      set_number: 1,
      set_type: 'normal',
      weight: initialWeight,
      reps: initialReps,
      rpe: prevSets.length > 0 ? prevSets[0].rpe : undefined,
      is_completed: false,
      is_pr: false,
      machine_id: chosenMachine?.id,
      machine_name: chosenMachine?.name,
      machine_settings: chosenMachine?.seat_setting
    };

    setActiveExercises(prev => [
      ...prev,
      {
        exercise,
        selectedMachine: chosenMachine,
        targetRepsMin: 8,
        targetRepsMax: 12,
        sets: [initialSet],
        previousSets: prevSets
      }
    ]);
  };

  const setExerciseMachine = async (exerciseId: string, machine: MachineVariant) => {
    const prevSets = await getPreviousSetsForExercise(exerciseId, machine.id);
    setActiveExercises(prev =>
      prev.map(item => {
        if (item.exercise.id !== exerciseId) return item;
        const updatedSets = item.sets.map(s => ({
          ...s,
          machine_id: machine.id,
          machine_name: machine.name,
          machine_settings: machine.seat_setting
        }));
        return {
          ...item,
          selectedMachine: machine,
          sets: updatedSets,
          previousSets: prevSets
        };
      })
    );
  };

  const setExerciseCustomRest = (exerciseId: string, seconds: number) => {
    setActiveExercises(prev =>
      prev.map(item => (item.exercise.id === exerciseId ? { ...item, customRestSeconds: seconds } : item))
    );
  };

  const setExerciseTargetRepRange = (exerciseId: string, min: number, max: number) => {
    setActiveExercises(prev =>
      prev.map(item => (item.exercise.id === exerciseId ? { ...item, targetRepsMin: min, targetRepsMax: max } : item))
    );
  };

  const applyOverloadIncrease = (exerciseId: string, newWeight: number) => {
    setActiveExercises(prev =>
      prev.map(item => {
        if (item.exercise.id !== exerciseId) return item;
        const updatedSets = item.sets.map(s => (s.is_completed ? s : { ...s, weight: newWeight }));
        return {
          ...item,
          sets: updatedSets
        };
      })
    );
  };

  const removeExerciseFromWorkout = (exerciseId: string) => {
    setActiveExercises(prev => prev.filter(e => e.exercise.id !== exerciseId));
  };

  const addSet = (exerciseId: string, setType: SetType = 'normal') => {
    if (!activeWorkout) return;
    setActiveExercises(prev =>
      prev.map(item => {
        if (item.exercise.id !== exerciseId) return item;
        const nextSetNum = item.sets.length + 1;
        const lastSet = item.sets[item.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `set_${activeWorkout.id}_${exerciseId}_${nextSetNum}_${Date.now()}`,
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          set_number: nextSetNum,
          set_type: setType,
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 10,
          rpe: lastSet ? lastSet.rpe : undefined,
          is_completed: false,
          is_pr: false,
          machine_id: item.selectedMachine?.id,
          machine_name: item.selectedMachine?.name,
          machine_settings: item.selectedMachine?.seat_setting
        };
        return {
          ...item,
          sets: [...item.sets, newSet]
        };
      })
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setActiveExercises(prev =>
      prev.map(item => {
        if (item.exercise.id !== exerciseId) return item;
        const filtered = item.sets.filter(s => s.id !== setId);
        const renumbered = filtered.map((s, idx) => ({ ...s, set_number: idx + 1 }));
        return {
          ...item,
          sets: renumbered
        };
      })
    );
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    setActiveExercises(prev =>
      prev.map(item => {
        if (item.exercise.id !== exerciseId) return item;
        return {
          ...item,
          sets: item.sets.map(s => (s.id === setId ? { ...s, ...updates } : s))
        };
      })
    );
  };

  const toggleSetCompleted = async (exerciseId: string, setId: string) => {
    if (!activeWorkout) return;

    let targetSet: WorkoutSet | null = null;
    let targetExerciseSession: ActiveExerciseSession | null = null;

    for (const exSession of activeExercises) {
      if (exSession.exercise.id === exerciseId) {
        targetExerciseSession = exSession;
        targetSet = exSession.sets.find(s => s.id === setId) || null;
        break;
      }
    }

    if (!targetSet || !targetExerciseSession) return;

    const willBeCompleted = !targetSet.is_completed;

    if (willBeCompleted) {
      // 1. Check for PR
      const prResult = await checkPersonalRecord(
        exerciseId,
        targetSet.weight,
        targetSet.reps,
        targetExerciseSession.selectedMachine?.id
      );

      if (prResult.isPR && prResult.type) {
        if (settings.hapticsEnabled) {
          triggerHapticPR();
        }

        const prNotification: PRNotification = {
          exerciseId,
          exerciseName: targetExerciseSession.selectedMachine
            ? `${targetExerciseSession.exercise.name} (${targetExerciseSession.selectedMachine.name})`
            : targetExerciseSession.exercise.name,
          type: prResult.type,
          value: prResult.type === 'reps' ? targetSet.reps : targetSet.weight,
          previousValue: prResult.previousValue || 0,
          unit: settings.unit,
          timestamp: Date.now()
        };

        setCurrentPRNotification(prNotification);

        updateSet(exerciseId, setId, {
          is_completed: true,
          is_pr: true,
          pr_type: prResult.type,
          completed_at: Date.now()
        });
      } else {
        if (settings.hapticsEnabled) {
          triggerHapticSuccess();
        }
        updateSet(exerciseId, setId, {
          is_completed: true,
          is_pr: false,
          completed_at: Date.now()
        });
      }

      // 2. Check for Progressive Overload (Feature 1: Prompt to increase load when hitting target reps)
      if (targetSet.reps >= targetExerciseSession.targetRepsMax && targetSet.weight > 0) {
        const stepIncrease = settings.unit === 'lbs' ? 5 : 2.5;
        const overloadPrompt: OverloadPrompt = {
          exerciseId,
          exerciseName: targetExerciseSession.exercise.name,
          currentWeight: targetSet.weight,
          repsAchieved: targetSet.reps,
          targetMaxReps: targetExerciseSession.targetRepsMax,
          recommendedWeight: targetSet.weight + stepIncrease,
          unit: settings.unit
        };
        // Show prompt if not already showing PR
        setTimeout(() => {
          setCurrentOverloadPrompt(overloadPrompt);
        }, 500);
      }

      // 3. Auto start rest timer
      if (settings.autoRestTimer) {
        const restDuration = targetExerciseSession.customRestSeconds || settings.defaultRestSeconds;
        startRestTimer(restDuration);
      }
    } else {
      updateSet(exerciseId, setId, {
        is_completed: false,
        is_pr: false,
        pr_type: undefined,
        completed_at: undefined
      });
    }
  };

  const finishWorkout = async (notes?: string) => {
    if (!activeWorkout) return;

    const allSets: WorkoutSet[] = [];
    activeExercises.forEach(item => {
      allSets.push(...item.sets);
    });

    const finishedWorkout: Workout = {
      ...activeWorkout,
      end_time: Date.now(),
      duration_seconds: elapsedSeconds,
      notes: notes || activeWorkout.notes
    };

    await saveCompletedWorkout(finishedWorkout, allSets);

    stopRestTimer();
    clearOngoingWorkoutNotification();
    setActiveWorkout(null);
    setActiveExercises([]);
    setIsWorkoutModalVisible(false);
    workoutStartRef.current = null;
    setElapsedSeconds(0);
  };

  const cancelWorkout = () => {
    stopRestTimer();
    clearOngoingWorkoutNotification();
    setActiveWorkout(null);
    setActiveExercises([]);
    setIsWorkoutModalVisible(false);
    workoutStartRef.current = null;
    setElapsedSeconds(0);
  };

  const dismissPRNotification = () => {
    setCurrentPRNotification(null);
  };

  const dismissOverloadPrompt = () => {
    setCurrentOverloadPrompt(null);
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <WorkoutContext.Provider
      value={{
        isWorkoutActive: activeWorkout !== null,
        activeWorkout,
        activeExercises,
        isWorkoutModalVisible,
        setIsWorkoutModalVisible,
        startWorkout,
        finishWorkout,
        cancelWorkout,
        addExerciseToWorkout,
        removeExerciseFromWorkout,
        setExerciseMachine,
        setExerciseCustomRest,
        setExerciseTargetRepRange,
        applyOverloadIncrease,
        addSet,
        removeSet,
        updateSet,
        toggleSetCompleted,
        elapsedSeconds,
        formattedWorkoutTime: formatTimer(elapsedSeconds),
        restRemaining,
        restTotal,
        isRestTimerActive,
        startRestTimer,
        pauseRestTimer,
        resumeRestTimer,
        adjustRestTimer,
        stopRestTimer,
        currentPRNotification,
        dismissPRNotification,
        currentOverloadPrompt,
        dismissOverloadPrompt
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
