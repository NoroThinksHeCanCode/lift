export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Quads'
  | 'Hamstrings'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Core'
  | 'Calves'
  | 'Glutes'
  | 'Full Body';

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Smith Machine'
  | 'Other';

export type JointAction =
  | 'Horizontal Adduction'
  | 'Horizontal Abduction'
  | 'Shoulder Flexion'
  | 'Shoulder Extension'
  | 'Shoulder Abduction'
  | 'Shoulder Adduction'
  | 'Elbow Flexion'
  | 'Elbow Extension'
  | 'Hip Extension'
  | 'Hip Flexion'
  | 'Hip Hinge'
  | 'Knee Extension'
  | 'Knee Flexion'
  | 'Plantarflexion'
  | 'Spinal Flexion'
  | 'Spinal Extension'
  | 'Compound Movement'
  | 'Other';

export interface MachineVariant {
  id: string;
  exercise_id: string;
  name: string;
  brand?: string;
  seat_setting?: string;
  resistance_ratio?: number;
  is_default?: boolean;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  is_custom: number;
  joint_action?: JointAction | string;
  notes?: string;
  machines?: MachineVariant[];
  default_reps_min?: number;
  default_reps_max?: number;
}

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  set_type: SetType;
  weight: number;
  reps: number;
  rpe?: number; // RPE (6-10) or RIR (0-4)
  is_completed: boolean;
  is_pr: boolean;
  pr_type?: 'weight' | 'reps' | '1rm';
  completed_at?: number;
  machine_id?: string;
  machine_name?: string;
  machine_settings?: string;
}

export interface ActiveExerciseSession {
  exercise: Exercise;
  selectedMachine?: MachineVariant;
  notes?: string; // Exercise-level note for this exercise (e.g. "Seat pin 4, slow eccentric")
  targetRepsMin: number; // e.g. 8
  targetRepsMax: number; // e.g. 12
  sets: WorkoutSet[];
  previousSets?: { weight: number; reps: number; set_type: SetType; rpe?: number; machine_name?: string }[];
}

export interface Workout {
  id: string;
  name: string;
  start_time: number;
  end_time?: number;
  duration_seconds: number;
  notes?: string;
  template_id?: string;
  sets?: WorkoutSet[];
  totalVolume?: number;
  totalSets?: number;
}

export interface Template {
  id: string;
  name: string;
  notes?: string;
  created_at: number;
  exercises?: {
    exercise: Exercise;
    target_sets: number;
    target_reps_min?: number;
    target_reps_max?: number;
    machine_id?: string;
  }[];
}

export interface PRNotification {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | '1rm';
  value: number;
  previousValue: number;
  unit: 'lbs' | 'kg';
  weight?: number;
  reps?: number;
  estimated1RM?: number;
  timestamp: number;
}

export interface OverloadPrompt {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  repsAchieved: number;
  targetMaxReps: number;
  recommendedWeight: number;
  unit: 'lbs' | 'kg';
}

export interface UserSettings {
  unit: 'lbs' | 'kg';
  defaultRestSeconds: number;
  defaultRepRangeMin: number;
  defaultRepRangeMax: number;
  barWeightLbs: number;
  barWeightKg: number;
  hapticsEnabled: boolean;
  autoRestTimer: boolean;
  notificationBarEnabled: boolean;
  rpeScale: 'RPE' | 'RIR'; // 'RPE' (1-10) or 'RIR' (0-4)
  userName?: string;
}

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  sublabel?: string;
}

export interface WorkoutSummaryPR {
  exerciseName: string;
  type: 'weight' | 'reps' | '1rm';
  weight: number;
  reps: number;
  estimated1RM: number;
  unit: string;
}

export interface WorkoutSummaryExercise {
  exerciseName: string;
  totalSets: number;
  bestSet: {
    weight: number;
    reps: number;
  };
  hasPR: boolean;
}

export interface WorkoutSummary {
  workoutName: string;
  durationSeconds: number;
  formattedDuration: string;
  totalVolume: number;
  totalSets: number;
  completedSetsCount: number;
  prs: WorkoutSummaryPR[];
  exercises: WorkoutSummaryExercise[];
  completedAt: number;
}
