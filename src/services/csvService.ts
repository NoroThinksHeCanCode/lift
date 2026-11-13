import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDB } from '../db/database';
import { WorkoutSet } from '../types';

/**
 * Exports all logged workouts and sets into a clean, standard CSV file.
 * Compatible with Excel, Google Sheets, Strong, and Hevy.
 */
export async function exportWorkoutsToCSV(unit: 'lbs' | 'kg'): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const db = await getDB();

    const rows = await db.getAllAsync<{
      workout_id: string;
      workout_name: string;
      start_time: number;
      duration_seconds: number;
      workout_notes?: string;
      exercise_id: string;
      exercise_name: string;
      muscle_group: string;
      equipment: string;
      machine_name?: string;
      machine_settings?: string;
      set_number: number;
      set_type: string;
      weight: number;
      reps: number;
      rpe?: number;
      is_pr: number;
      completed_at: number;
    }>(`
      SELECT 
        w.id as workout_id,
        w.name as workout_name,
        w.start_time,
        w.duration_seconds,
        w.notes as workout_notes,
        e.id as exercise_id,
        e.name as exercise_name,
        e.muscle_group,
        e.equipment,
        s.machine_name,
        s.machine_settings,
        s.set_number,
        s.set_type,
        s.weight,
        s.reps,
        s.rpe,
        s.is_pr,
        s.completed_at
      FROM workout_sets s
      JOIN workouts w ON s.workout_id = w.id
      JOIN exercises e ON s.exercise_id = e.id
      WHERE s.is_completed = 1
      ORDER BY w.start_time DESC, s.completed_at ASC, s.set_number ASC
    `);

    if (rows.length === 0) {
      return { success: false, error: 'No completed workouts found to export.' };
    }

    // CSV Header
    const headers = [
      'Date',
      'Workout Name',
      'Duration (min)',
      'Exercise Name',
      'Muscle Group',
      'Equipment',
      'Machine Name',
      'Machine Setting',
      'Set Number',
      'Set Type',
      'Weight',
      'Unit',
      'Reps',
      'RPE/RIR',
      'Is PR',
      'Workout Notes'
    ];

    const escapeCSV = (field: any) => {
      if (field === null || field === undefined) return '';
      const str = String(field).replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    };

    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const dateStr = new Date(r.start_time).toISOString().split('T')[0];
      const durationMin = Math.round(r.duration_seconds / 60);

      const line = [
        escapeCSV(dateStr),
        escapeCSV(r.workout_name),
        escapeCSV(durationMin),
        escapeCSV(r.exercise_name),
        escapeCSV(r.muscle_group),
        escapeCSV(r.equipment),
        escapeCSV(r.machine_name || ''),
        escapeCSV(r.machine_settings || ''),
        escapeCSV(r.set_number),
        escapeCSV(r.set_type),
        escapeCSV(r.weight),
        escapeCSV(unit),
        escapeCSV(r.reps),
        escapeCSV(r.rpe || ''),
        escapeCSV(r.is_pr === 1 ? 'Yes' : 'No'),
        escapeCSV(r.workout_notes || '')
      ].join(',');

      csvLines.push(line);
    }

    const csvContent = csvLines.join('\n');
    const fileName = `lift_export_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Lift Workout Data',
        UTI: 'public.comma-separated-values-text'
      });
    }

    return { success: true, filePath: fileUri };
  } catch (error: any) {
    console.error('Export CSV error:', error);
    return { success: false, error: error.message || 'Failed to export CSV.' };
  }
}

/**
 * Imports workout data from a CSV file.
 * Parses Lift format, Strong app format, and Hevy format.
 */
export async function importWorkoutsFromCSV(): Promise<{
  success: boolean;
  workoutsImported?: number;
  setsImported?: number;
  error?: string;
}> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
      copyToCacheDirectory: true
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, error: 'Document selection canceled.' };
    }

    const fileUri = result.assets[0].uri;
    const csvContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8
    });

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { success: false, error: 'CSV file is empty or missing data rows.' };
    }

    // Parse header
    const headerLine = lines[0];
    const headerCols = parseCSVLine(headerLine).map(c => c.trim().toLowerCase());

    const dateIdx = headerCols.findIndex(c => c.includes('date'));
    const workoutNameIdx = headerCols.findIndex(c => c.includes('workout'));
    const exerciseIdx = headerCols.findIndex(c => c.includes('exercise'));
    const weightIdx = headerCols.findIndex(c => c.includes('weight'));
    const repsIdx = headerCols.findIndex(c => c.includes('reps') || c.includes('rep'));
    const rpeIdx = headerCols.findIndex(c => c.includes('rpe') || c.includes('rir'));
    const machineIdx = headerCols.findIndex(c => c.includes('machine'));

    if (dateIdx === -1 || exerciseIdx === -1 || weightIdx === -1 || repsIdx === -1) {
      return {
        success: false,
        error: 'Unrecognized CSV format. Headers must include Date, Exercise, Weight, and Reps.'
      };
    }

    const db = await getDB();
    let totalWorkouts = 0;
    let totalSets = 0;

    // Group parsed rows by Date + Workout Name
    const workoutBuckets = new Map<string, {
      name: string;
      date: string;
      sets: {
        exerciseName: string;
        weight: number;
        reps: number;
        rpe?: number;
        machineName?: string;
      }[];
    }>();

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length <= Math.max(dateIdx, exerciseIdx, weightIdx, repsIdx)) continue;

      const dateStr = cols[dateIdx]?.trim();
      const workoutName = workoutNameIdx !== -1 && cols[workoutNameIdx] ? cols[workoutNameIdx].trim() : `Workout • ${dateStr}`;
      const exerciseName = cols[exerciseIdx]?.trim();
      const weight = parseFloat(cols[weightIdx]) || 0;
      const reps = parseInt(cols[repsIdx], 10) || 0;
      const rpe = rpeIdx !== -1 && cols[rpeIdx] ? parseFloat(cols[rpeIdx]) : undefined;
      const machineName = machineIdx !== -1 && cols[machineIdx] ? cols[machineIdx].trim() : undefined;

      if (!exerciseName || reps <= 0) continue;

      const bucketKey = `${dateStr}__${workoutName}`;
      if (!workoutBuckets.has(bucketKey)) {
        workoutBuckets.set(bucketKey, {
          name: workoutName,
          date: dateStr,
          sets: []
        });
      }

      workoutBuckets.get(bucketKey)?.sets.push({
        exerciseName,
        weight,
        reps,
        rpe,
        machineName
      });
    }

    // Insert into SQLite database
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const [key, b] of workoutBuckets.entries()) {
        const workoutId = `import_w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const timestamp = new Date(b.date).getTime() || Date.now();

        await txn.runAsync(
          `INSERT OR IGNORE INTO workouts (id, name, start_time, end_time, duration_seconds, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          workoutId, b.name, timestamp, timestamp + 3600 * 1000, 3600, 'Imported from CSV'
        );
        totalWorkouts++;

        let setNum = 1;
        for (const s of b.sets) {
          // Find or create exercise
          let exRow = await txn.getFirstAsync<{ id: string }>(
            'SELECT id FROM exercises WHERE LOWER(name) = LOWER(?)',
            s.exerciseName
          );

          let exId = exRow?.id;
          if (!exId) {
            exId = `import_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await txn.runAsync(
              `INSERT INTO exercises (id, name, muscle_group, equipment, is_custom, notes)
               VALUES (?, ?, 'Full Body', 'Other', 1, 'Auto-created during CSV import')`,
              exId, s.exerciseName
            );
          }

          const setId = `import_s_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          await txn.runAsync(
            `INSERT INTO workout_sets (
              id, workout_id, exercise_id, set_number, set_type, weight, reps, rpe, is_completed, is_pr, completed_at, machine_name
            ) VALUES (?, ?, ?, ?, 'normal', ?, ?, ?, 1, 0, ?, ?)`,
            setId, workoutId, exId, setNum++, s.weight, s.reps, s.rpe || null, timestamp, s.machineName || null
          );
          totalSets++;
        }
      }
    });

    return {
      success: true,
      workoutsImported: totalWorkouts,
      setsImported: totalSets
    };
  } catch (error: any) {
    console.error('Import CSV error:', error);
    return { success: false, error: error.message || 'Failed to import CSV.' };
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
