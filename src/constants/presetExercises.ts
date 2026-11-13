import { Exercise } from '../types';

export const PRESET_EXERCISES: Omit<Exercise, 'is_custom'>[] = [
  // CHEST
  { id: 'ex_bench_press', name: 'Barbell Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
  { id: 'ex_incline_bench', name: 'Incline Barbell Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
  { id: 'ex_db_bench', name: 'Dumbbell Bench Press', muscle_group: 'Chest', equipment: 'Dumbbell' },
  { id: 'ex_incline_db_bench', name: 'Incline Dumbbell Press', muscle_group: 'Chest', equipment: 'Dumbbell' },
  { id: 'ex_dips_chest', name: 'Chest Dips', muscle_group: 'Chest', equipment: 'Bodyweight' },
  { id: 'ex_cable_flyes', name: 'Cable Flyes', muscle_group: 'Chest', equipment: 'Cable' },
  { id: 'ex_pec_deck', name: 'Pec Deck Machine', muscle_group: 'Chest', equipment: 'Machine' },
  { id: 'ex_pushups', name: 'Push-Ups', muscle_group: 'Chest', equipment: 'Bodyweight' },

  // BACK
  { id: 'ex_deadlift_conv', name: 'Barbell Deadlift (Conventional)', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 'ex_barbell_row', name: 'Bent-Over Barbell Row', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 'ex_pullups', name: 'Pull-Ups', muscle_group: 'Back', equipment: 'Bodyweight' },
  { id: 'ex_lat_pulldown', name: 'Lat Pulldown', muscle_group: 'Back', equipment: 'Cable' },
  { id: 'ex_seated_cable_row', name: 'Seated Cable Row', muscle_group: 'Back', equipment: 'Cable' },
  { id: 'ex_db_row', name: 'Single-Arm Dumbbell Row', muscle_group: 'Back', equipment: 'Dumbbell' },
  { id: 'ex_t_bar_row', name: 'T-Bar Row', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 'ex_face_pull', name: 'Face Pull', muscle_group: 'Back', equipment: 'Cable' },

  // SHOULDERS
  { id: 'ex_ohp_barbell', name: 'Overhead Press (OHP)', muscle_group: 'Shoulders', equipment: 'Barbell' },
  { id: 'ex_db_shoulder_press', name: 'Seated Dumbbell Shoulder Press', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'ex_lateral_raise_db', name: 'Dumbbell Lateral Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'ex_cable_lateral_raise', name: 'Cable Lateral Raise', muscle_group: 'Shoulders', equipment: 'Cable' },
  { id: 'ex_rear_delt_fly', name: 'Rear Delt Reverse Fly', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'ex_arnold_press', name: 'Arnold Press', muscle_group: 'Shoulders', equipment: 'Dumbbell' },

  // QUADS & LEGS
  { id: 'ex_barbell_squat', name: 'Barbell Back Squat', muscle_group: 'Quads', equipment: 'Barbell' },
  { id: 'ex_front_squat', name: 'Barbell Front Squat', muscle_group: 'Quads', equipment: 'Barbell' },
  { id: 'ex_leg_press', name: 'Leg Press', muscle_group: 'Quads', equipment: 'Machine' },
  { id: 'ex_hack_squat', name: 'Hack Squat', muscle_group: 'Quads', equipment: 'Machine' },
  { id: 'ex_leg_extension', name: 'Leg Extensions', muscle_group: 'Quads', equipment: 'Machine' },
  { id: 'ex_bulgarian_split_squat', name: 'Bulgarian Split Squat', muscle_group: 'Quads', equipment: 'Dumbbell' },
  { id: 'ex_goblet_squat', name: 'Goblet Squat', muscle_group: 'Quads', equipment: 'Dumbbell' },

  // HAMSTRINGS & GLUTES
  { id: 'ex_romanian_deadlift', name: 'Romanian Deadlift (RDL)', muscle_group: 'Hamstrings', equipment: 'Barbell' },
  { id: 'ex_db_rdl', name: 'Dumbbell RDL', muscle_group: 'Hamstrings', equipment: 'Dumbbell' },
  { id: 'ex_lying_leg_curl', name: 'Lying Leg Curl', muscle_group: 'Hamstrings', equipment: 'Machine' },
  { id: 'ex_seated_leg_curl', name: 'Seated Leg Curl', muscle_group: 'Hamstrings', equipment: 'Machine' },
  { id: 'ex_barbell_hip_thrust', name: 'Barbell Hip Thrust', muscle_group: 'Glutes', equipment: 'Barbell' },

  // ARMS - BICEPS
  { id: 'ex_barbell_curl', name: 'Barbell Bicep Curl', muscle_group: 'Biceps', equipment: 'Barbell' },
  { id: 'ex_db_bicep_curl', name: 'Dumbbell Bicep Curl', muscle_group: 'Biceps', equipment: 'Dumbbell' },
  { id: 'ex_incline_db_curl', name: 'Incline Dumbbell Curl', muscle_group: 'Biceps', equipment: 'Dumbbell' },
  { id: 'ex_hammer_curl', name: 'Hammer Curl', muscle_group: 'Biceps', equipment: 'Dumbbell' },
  { id: 'ex_preacher_curl', name: 'Preacher Curl', muscle_group: 'Biceps', equipment: 'Machine' },

  // ARMS - TRICEPS
  { id: 'ex_tricep_pushdown', name: 'Cable Tricep Pushdown', muscle_group: 'Triceps', equipment: 'Cable' },
  { id: 'ex_skull_crushers', name: 'Barbell Skull Crushers', muscle_group: 'Triceps', equipment: 'Barbell' },
  { id: 'ex_overhead_tricep_ext', name: 'Overhead Dumbbell Tricep Extension', muscle_group: 'Triceps', equipment: 'Dumbbell' },
  { id: 'ex_close_grip_bench', name: 'Close-Grip Bench Press', muscle_group: 'Triceps', equipment: 'Barbell' },

  // CALVES & CORE
  { id: 'ex_standing_calf_raise', name: 'Standing Calf Raise', muscle_group: 'Calves', equipment: 'Machine' },
  { id: 'ex_seated_calf_raise', name: 'Seated Calf Raise', muscle_group: 'Calves', equipment: 'Machine' },
  { id: 'ex_hanging_leg_raise', name: 'Hanging Leg Raise', muscle_group: 'Core', equipment: 'Bodyweight' },
  { id: 'ex_cable_crunch', name: 'Cable Rope Crunch', muscle_group: 'Core', equipment: 'Cable' },
  { id: 'ex_plank', name: 'Plank', muscle_group: 'Core', equipment: 'Bodyweight' },
  { id: 'ex_ab_wheel', name: 'Ab Wheel Rollout', muscle_group: 'Core', equipment: 'Bodyweight' }
];
