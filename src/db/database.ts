import * as SQLite from 'expo-sqlite';
import {
  Exercise,
  Workout,
  WorkoutSet,
  Template,
  MuscleGroup,
  Equipment,
  SetType,
  MachineVariant
} from '../types';
import { PRESET_EXERCISES } from '../constants/presetExercises';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('irontrack.db');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDB();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      equipment TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      joint_action TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS exercise_machines (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      seat_setting TEXT,
      resistance_ratio REAL DEFAULT 1.0,
      is_default INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      target_sets INTEGER DEFAULT 3,
      machine_id TEXT,
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration_seconds INTEGER DEFAULT 0,
      notes TEXT,
      template_id TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      set_type TEXT DEFAULT 'normal',
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      rpe REAL,
      is_completed INTEGER DEFAULT 1,
      is_pr INTEGER DEFAULT 0,
      pr_type TEXT,
      completed_at INTEGER NOT NULL,
      machine_id TEXT,
      machine_name TEXT,
      machine_settings TEXT,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  try {
    await db.execAsync('ALTER TABLE exercises ADD COLUMN joint_action TEXT;');
  } catch (_) {}

  // Seed exercises if empty
  const exCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
  if (!exCount || exCount.count === 0) {
    for (const ex of PRESET_EXERCISES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO exercises (id, name, muscle_group, equipment, is_custom, joint_action, notes) VALUES (?, ?, ?, ?, 0, ?, ?)',
        ex.id, ex.name, ex.muscle_group, ex.equipment, ex.joint_action || '', ''
      );
    }
    await seedDefaultMachines(db);
  } else {
    // Update joint actions for presets if missing
    for (const ex of PRESET_EXERCISES) {
      if (ex.joint_action) {
        await db.runAsync(
          'UPDATE exercises SET joint_action = ? WHERE id = ? AND (joint_action IS NULL OR joint_action = "")',
          ex.joint_action, ex.id
        );
      }
    }
  }

  // Seed templates if empty
  const tempCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM templates');
  if (!tempCount || tempCount.count === 0) {
    await seedDefaultTemplates(db);
  }
}

async function seedDefaultMachines(db: SQLite.SQLiteDatabase) {
  const defaultMachines = [
    { id: 'm_lat_hs', exercise_id: 'ex_lat_pulldown', name: 'Hammer Strength Plate-Loaded', brand: 'Hammer Strength', seat_setting: 'Thigh pad #3', resistance_ratio: 1.0 },
    { id: 'm_lat_cable', exercise_id: 'ex_lat_pulldown', name: 'Life Fitness Pin Stack (Wide)', brand: 'Life Fitness', seat_setting: 'Pin stack 1:1', resistance_ratio: 1.0 },
    { id: 'm_legpress_45', exercise_id: 'ex_leg_press', name: '45-Degree Incline Plate Loaded', brand: 'Cybex', seat_setting: 'Back angle #4', resistance_ratio: 0.707 },
    { id: 'm_legpress_horiz', exercise_id: 'ex_leg_press', name: 'Horizontal Cable / Pin Press', brand: 'Matrix', seat_setting: 'Footplate high', resistance_ratio: 1.0 },
    { id: 'm_chest_hs', exercise_id: 'ex_db_bench', name: 'Iso-Lateral Chest Press', brand: 'Hammer Strength', seat_setting: 'Seat #5', resistance_ratio: 1.0 },
    { id: 'm_pec_deck', exercise_id: 'ex_pec_deck', name: 'Rear Delt / Pec Fly Combo', brand: 'Life Fitness', seat_setting: 'Arm pin #4', resistance_ratio: 1.0 }
  ];

  for (const m of defaultMachines) {
    await db.runAsync(
      'INSERT OR IGNORE INTO exercise_machines (id, exercise_id, name, brand, seat_setting, resistance_ratio, is_default, notes) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      m.id, m.exercise_id, m.name, m.brand, m.seat_setting, m.resistance_ratio, ''
    );
  }
}

async function seedDefaultTemplates(db: SQLite.SQLiteDatabase) {
  const defaultTemplates = [
    {
      id: 'template_push',
      name: 'Push Day (Chest, Shoulders, Triceps)',
      notes: 'Hypertrophy push workout',
      exercises: ['ex_bench_press', 'ex_incline_db_bench', 'ex_ohp_barbell', 'ex_lateral_raise_db', 'ex_tricep_pushdown']
    },
    {
      id: 'template_pull',
      name: 'Pull Day (Back & Biceps)',
      notes: 'Vertical & horizontal pulling power',
      exercises: ['ex_deadlift_conv', 'ex_lat_pulldown', 'ex_barbell_row', 'ex_face_pull', 'ex_barbell_curl']
    },
    {
      id: 'template_legs',
      name: 'Leg Day (Quads & Hamstrings)',
      notes: 'Lower body compound foundation',
      exercises: ['ex_barbell_squat', 'ex_romanian_deadlift', 'ex_leg_press', 'ex_lying_leg_curl', 'ex_standing_calf_raise']
    }
  ];

  const now = Date.now();
  for (const t of defaultTemplates) {
    await db.runAsync('INSERT INTO templates (id, name, notes, created_at) VALUES (?, ?, ?, ?)', t.id, t.name, t.notes, now);
    for (let i = 0; i < t.exercises.length; i++) {
      await db.runAsync(
        'INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets) VALUES (?, ?, ?, ?, ?)',
        `${t.id}_${i}`, t.id, t.exercises[i], i, 3
      );
    }
  }
}

// ==================== EXERCISES & MACHINES ====================

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  const exercises = await db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY name ASC');
  for (const ex of exercises) {
    const machines = await db.getAllAsync<MachineVariant>(
      'SELECT * FROM exercise_machines WHERE exercise_id = ? ORDER BY is_default DESC, name ASC',
      ex.id
    );
    ex.machines = machines;
  }
  return exercises;
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<Exercise>('SELECT * FROM exercises WHERE id = ?', id);
  if (!row) return null;
  const machines = await db.getAllAsync<MachineVariant>(
    'SELECT * FROM exercise_machines WHERE exercise_id = ? ORDER BY is_default DESC, name ASC',
    id
  );
  row.machines = machines;
  return row;
}

export async function addMachineToExercise(
  exerciseId: string,
  name: string,
  brand?: string,
  seatSetting?: string,
  resistanceRatio: number = 1.0,
  notes?: string
): Promise<MachineVariant> {
  const db = await getDB();
  const id = `machine_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await db.runAsync(
    `INSERT INTO exercise_machines (id, exercise_id, name, brand, seat_setting, resistance_ratio, is_default, notes)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    id, exerciseId, name.trim(), brand?.trim() || '', seatSetting?.trim() || '', resistanceRatio, notes?.trim() || ''
  );
  return {
    id,
    exercise_id: exerciseId,
    name: name.trim(),
    brand: brand?.trim(),
    seat_setting: seatSetting?.trim(),
    resistance_ratio: resistanceRatio,
    notes: notes?.trim()
  };
}

export async function createCustomExercise(
  name: string,
  muscleGroup: MuscleGroup,
  equipment: Equipment,
  jointAction?: string,
  notes?: string
): Promise<Exercise> {
  const db = await getDB();
  const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await db.runAsync(
    'INSERT INTO exercises (id, name, muscle_group, equipment, is_custom, joint_action, notes) VALUES (?, ?, ?, ?, 1, ?, ?)',
    id, name.trim(), muscleGroup, equipment, jointAction?.trim() || '', notes?.trim() || ''
  );
  return {
    id,
    name: name.trim(),
    muscle_group: muscleGroup,
    equipment,
    is_custom: 1,
    joint_action: jointAction?.trim() || '',
    notes: notes?.trim(),
    machines: []
  };
}

export async function updateExerciseNotes(exerciseId: string, notes: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('UPDATE exercises SET notes = ? WHERE id = ?', notes.trim(), exerciseId);
}

// ==================== PR CALCULATION ====================

export function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export async function checkPersonalRecord(
  exerciseId: string,
  weight: number,
  reps: number,
  machineId?: string
): Promise<{ isPR: boolean; type?: 'weight' | 'reps' | '1rm'; previousValue?: number }> {
  if (weight <= 0 || reps <= 0) return { isPR: false };
  const db = await getDB();

  // If machine-specific, compare against sets on the same machine variant
  const machineClause = machineId ? `AND machine_id = '${machineId}'` : '';

  const maxWeightRow = await db.getFirstAsync<{ max_weight: number }>(
    `SELECT MAX(weight) as max_weight FROM workout_sets WHERE exercise_id = ? AND is_completed = 1 ${machineClause}`,
    exerciseId
  );
  const currentMaxWeight = maxWeightRow?.max_weight || 0;

  const allSets = await db.getAllAsync<{ weight: number; reps: number }>(
    `SELECT weight, reps FROM workout_sets WHERE exercise_id = ? AND is_completed = 1 ${machineClause}`,
    exerciseId
  );

  let currentBest1RM = 0;
  for (const s of allSets) {
    const e1rm = calculateEstimated1RM(s.weight, s.reps);
    if (e1rm > currentBest1RM) currentBest1RM = e1rm;
  }

  const maxRepsRow = await db.getFirstAsync<{ max_reps: number }>(
    `SELECT MAX(reps) as max_reps FROM workout_sets WHERE exercise_id = ? AND weight = ? AND is_completed = 1 ${machineClause}`,
    exerciseId, weight
  );
  const currentMaxReps = maxRepsRow?.max_reps || 0;

  const this1RM = calculateEstimated1RM(weight, reps);

  if (allSets.length === 0) {
    return { isPR: true, type: 'weight', previousValue: 0 };
  }

  if (weight > currentMaxWeight) {
    return { isPR: true, type: 'weight', previousValue: currentMaxWeight };
  }

  if (this1RM > currentBest1RM) {
    return { isPR: true, type: '1rm', previousValue: currentBest1RM };
  }

  if (reps > currentMaxReps && currentMaxReps > 0) {
    return { isPR: true, type: 'reps', previousValue: currentMaxReps };
  }

  return { isPR: false };
}

export async function getPreviousSetsForExercise(
  exerciseId: string,
  machineId?: string
): Promise<{ weight: number; reps: number; set_type: SetType; rpe?: number; machine_name?: string }[]> {
  const db = await getDB();
  const machineClause = machineId ? `AND machine_id = '${machineId}'` : '';

  const lastWorkout = await db.getFirstAsync<{ workout_id: string }>(
    `SELECT workout_id FROM workout_sets 
     WHERE exercise_id = ? AND is_completed = 1 ${machineClause}
     ORDER BY completed_at DESC LIMIT 1`,
    exerciseId
  );

  if (!lastWorkout) return [];

  const sets = await db.getAllAsync<{ weight: number; reps: number; set_type: SetType; rpe?: number; machine_name?: string }>(
    `SELECT weight, reps, set_type, rpe, machine_name FROM workout_sets 
     WHERE workout_id = ? AND exercise_id = ? AND is_completed = 1 ${machineClause}
     ORDER BY set_number ASC`,
    lastWorkout.workout_id, exerciseId
  );

  return sets.map(s => ({
    weight: s.weight,
    reps: s.reps,
    set_type: s.set_type,
    rpe: s.rpe,
    machine_name: s.machine_name
  }));
}

// ==================== WORKOUTS & CALENDAR ====================

export async function saveCompletedWorkout(
  workout: Workout,
  sets: WorkoutSet[]
): Promise<void> {
  const db = await getDB();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT OR REPLACE INTO workouts (id, name, start_time, end_time, duration_seconds, notes, template_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      workout.id,
      workout.name,
      workout.start_time,
      workout.end_time || Date.now(),
      workout.duration_seconds,
      workout.notes || '',
      workout.template_id || null
    );

    await txn.runAsync('DELETE FROM workout_sets WHERE workout_id = ?', workout.id);

    for (const set of sets) {
      await txn.runAsync(
        `INSERT INTO workout_sets (
          id, workout_id, exercise_id, set_number, set_type, weight, reps, rpe, is_completed, is_pr, pr_type, completed_at,
          machine_id, machine_name, machine_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        set.id,
        workout.id,
        set.exercise_id,
        set.set_number,
        set.set_type,
        set.weight,
        set.reps,
        set.rpe || null,
        set.is_completed ? 1 : 0,
        set.is_pr ? 1 : 0,
        set.pr_type || null,
        set.completed_at || Date.now(),
        set.machine_id || null,
        set.machine_name || null,
        set.machine_settings || null
      );
    }
  });
}

export async function getWorkoutHistory(limit: number = 30): Promise<Workout[]> {
  const db = await getDB();
  const workouts = await db.getAllAsync<Workout>(
    `SELECT * FROM workouts ORDER BY start_time DESC LIMIT ?`,
    limit
  );

  for (const w of workouts) {
    const sets = await db.getAllAsync<WorkoutSet>(
      `SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY set_number ASC`,
      w.id
    );
    w.sets = sets;
    w.totalSets = sets.filter(s => s.is_completed).length;
    w.totalVolume = sets
      .filter(s => s.is_completed)
      .reduce((acc, s) => acc + (s.weight * s.reps), 0);
  }

  return workouts;
}

export async function getWorkoutsByMonth(year: number, month: number): Promise<Record<string, Workout[]>> {
  const db = await getDB();
  const startOfMonth = new Date(year, month - 1, 1).getTime();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();

  const workouts = await db.getAllAsync<Workout>(
    `SELECT * FROM workouts WHERE start_time >= ? AND start_time <= ? ORDER BY start_time ASC`,
    startOfMonth, endOfMonth
  );

  const dateMap: Record<string, Workout[]> = {};

  for (const w of workouts) {
    const d = new Date(w.start_time);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const sets = await db.getAllAsync<WorkoutSet>(
      `SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY set_number ASC`,
      w.id
    );
    w.sets = sets;
    w.totalSets = sets.filter(s => s.is_completed).length;
    w.totalVolume = sets.filter(s => s.is_completed).reduce((sum, s) => sum + s.weight * s.reps, 0);

    if (!dateMap[dateKey]) dateMap[dateKey] = [];
    dateMap[dateKey].push(w);
  }

  return dateMap;
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDB();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM workout_sets WHERE workout_id = ?', id);
    await txn.runAsync('DELETE FROM workouts WHERE id = ?', id);
  });
}

// ==================== TEMPLATES ====================

export async function getAllTemplates(): Promise<Template[]> {
  const db = await getDB();
  const templates = await db.getAllAsync<{ id: string; name: string; notes?: string; created_at: number }>(
    'SELECT * FROM templates ORDER BY created_at DESC'
  );

  const result: Template[] = [];
  for (const t of templates) {
    const rawExercises = await db.getAllAsync<{
      exercise_id: string;
      order_index: number;
      target_sets: number;
      name: string;
      muscle_group: MuscleGroup;
      equipment: Equipment;
      is_custom: number;
      notes?: string;
    }>(
      `SELECT te.exercise_id, te.order_index, te.target_sets, 
              e.name, e.muscle_group, e.equipment, e.is_custom, e.notes
       FROM template_exercises te
       JOIN exercises e ON te.exercise_id = e.id
       WHERE te.template_id = ?
       ORDER BY te.order_index ASC`,
      t.id
    );

    result.push({
      ...t,
      exercises: rawExercises.map(re => ({
        exercise: {
          id: re.exercise_id,
          name: re.name,
          muscle_group: re.muscle_group,
          equipment: re.equipment,
          is_custom: re.is_custom,
          notes: re.notes
        },
        target_sets: re.target_sets
      }))
    });
  }

  return result;
}

export async function saveTemplate(
  name: string,
  notes: string,
  exercises: { exerciseId: string; targetSets: number }[],
  templateId?: string
): Promise<string> {
  const db = await getDB();
  const id = templateId || `template_${Date.now()}`;

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      'INSERT OR REPLACE INTO templates (id, name, notes, created_at) VALUES (?, ?, ?, ?)',
      id, name.trim(), notes.trim(), Date.now()
    );

    await txn.runAsync('DELETE FROM template_exercises WHERE template_id = ?', id);

    for (let i = 0; i < exercises.length; i++) {
      const e = exercises[i];
      await txn.runAsync(
        'INSERT INTO template_exercises (id, template_id, exercise_id, order_index, target_sets) VALUES (?, ?, ?, ?, ?)',
        `${id}_${i}`, id, e.exerciseId, i, e.targetSets
      );
    }
  });

  return id;
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM template_exercises WHERE template_id = ?', id);
    await txn.runAsync('DELETE FROM templates WHERE id = ?', id);
  });
}

// ==================== ANALYTICS & CHARTS ====================

export interface ExerciseProgressPoint {
  date: string;
  timestamp: number;
  maxWeight: number;
  bestEstimated1RM: number;
  totalVolume: number;
  repsAtMax: number;
}

export async function getExerciseProgress(exerciseId: string, machineId?: string): Promise<ExerciseProgressPoint[]> {
  const db = await getDB();
  const machineClause = machineId ? `AND machine_id = '${machineId}'` : '';

  const rows = await db.getAllAsync<{
    completed_at: number;
    weight: number;
    reps: number;
  }>(
    `SELECT completed_at, weight, reps FROM workout_sets 
     WHERE exercise_id = ? AND is_completed = 1 ${machineClause}
     ORDER BY completed_at ASC`,
    exerciseId
  );

  const dayMap = new Map<string, {
    timestamp: number;
    maxWeight: number;
    best1RM: number;
    totalVolume: number;
    repsAtMax: number;
  }>();

  for (const row of rows) {
    const d = new Date(row.completed_at);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const e1rm = calculateEstimated1RM(row.weight, row.reps);
    const volume = row.weight * row.reps;

    const existing = dayMap.get(dateKey);
    if (!existing) {
      dayMap.set(dateKey, {
        timestamp: row.completed_at,
        maxWeight: row.weight,
        best1RM: e1rm,
        totalVolume: volume,
        repsAtMax: row.reps
      });
    } else {
      existing.totalVolume += volume;
      if (row.weight > existing.maxWeight) {
        existing.maxWeight = row.weight;
        existing.repsAtMax = row.reps;
      }
      if (e1rm > existing.best1RM) {
        existing.best1RM = e1rm;
      }
    }
  }

  return Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    timestamp: data.timestamp,
    maxWeight: data.maxWeight,
    bestEstimated1RM: data.best1RM,
    totalVolume: data.totalVolume,
    repsAtMax: data.repsAtMax
  }));
}

export async function getWeeklyVolumeData(): Promise<{ weekLabel: string; totalVolume: number; workoutsCount: number }[]> {
  const db = await getDB();
  const workouts = await db.getAllAsync<{ id: string; start_time: number }>(
    `SELECT id, start_time FROM workouts ORDER BY start_time DESC LIMIT 40`
  );

  const weekMap = new Map<string, { totalVolume: number; workoutsCount: number }>();
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  for (let i = 5; i >= 0; i--) {
    const label = i === 0 ? 'This Wk' : `${i}w ago`;
    weekMap.set(label, { totalVolume: 0, workoutsCount: 0 });
  }

  for (const w of workouts) {
    const diffWeeks = Math.floor((now - w.start_time) / ONE_WEEK_MS);
    if (diffWeeks >= 0 && diffWeeks < 6) {
      const label = diffWeeks === 0 ? 'This Wk' : `${diffWeeks}w ago`;
      const sets = await db.getAllAsync<{ weight: number; reps: number }>(
        `SELECT weight, reps FROM workout_sets WHERE workout_id = ? AND is_completed = 1`,
        w.id
      );
      const vol = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

      const entry = weekMap.get(label);
      if (entry) {
        entry.totalVolume += vol;
        entry.workoutsCount += 1;
      }
    }
  }

  return Array.from(weekMap.entries()).map(([weekLabel, val]) => ({
    weekLabel,
    totalVolume: Math.round(val.totalVolume),
    workoutsCount: val.workoutsCount
  }));
}
