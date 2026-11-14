import { NativeModules, DeviceEventEmitter, PermissionsAndroid, Platform } from 'react-native';

const { LiftSpeech } = NativeModules;

export interface ParsedGymSpeech {
  rawText: string;
  weight: number | null;
  reps: number | null;
  rpe?: number;
  exerciseNameQuery?: string;
  matchedExerciseId?: string;
  confidence: 'high' | 'medium' | 'low';
}

// Convert spoken number words to numeric values
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100
};

// Spoken plate shorthand (in lbs or kg)
const PLATE_SHORTHAND_LBS: Record<string, number> = {
  'one plate': 135,
  '1 plate': 135,
  'two plates': 225,
  '2 plates': 225,
  'three plates': 315,
  '3 plates': 315,
  'four plates': 405,
  '4 plates': 405,
  'five plates': 495,
  '5 plates': 495
};

const PLATE_SHORTHAND_KG: Record<string, number> = {
  'one plate': 60,
  '1 plate': 60,
  'two plates': 100,
  '2 plates': 100,
  'three plates': 140,
  '3 plates': 140,
  'four plates': 180,
  '4 plates': 180,
  'five plates': 220,
  '5 plates': 220
};

/**
 * Pre-processes natural spoken speech into standardized tokens
 * e.g. "two twenty five" -> "225", "eight" -> "8"
 */
function normalizeSpokenNumbers(text: string, unit: 'lbs' | 'kg'): string {
  let cleaned = text.toLowerCase().trim();

  // Handle barbell plate slang
  const plateMap = unit === 'kg' ? PLATE_SHORTHAND_KG : PLATE_SHORTHAND_LBS;
  for (const [phrase, weight] of Object.entries(plateMap)) {
    if (cleaned.includes(phrase)) {
      cleaned = cleaned.replace(new RegExp(phrase, 'g'), `${weight} ${unit}`);
    }
  }

  // Handle "and a half" e.g. "twenty two and a half" -> 22.5
  cleaned = cleaned.replace(/(\d+)\s+and\s+a\s+half/gi, '$1.5');
  cleaned = cleaned.replace(/and\s+a\s+half/gi, '.5');

  // Handle common compound gym spoken numbers e.g. "two twenty five" -> 225
  const spokenCompounds: [RegExp, string][] = [
    [/one\s+thirty\s+five/gi, '135'],
    [/one\s+forty\s+five/gi, '145'],
    [/one\s+fifty/gi, '150'],
    [/one\s+eighty\s+five/gi, '185'],
    [/two\s+twenty\s+five/gi, '225'],
    [/two\s+fifty/gi, '250'],
    [/two\s+seventy\s+five/gi, '275'],
    [/three\s+fifteen/gi, '315'],
    [/three\s+fifty/gi, '350'],
    [/three\s+sixty\s+five/gi, '365'],
    [/four\s+(?:o|zero|oh)\s+five/gi, '405'],
    [/four\s+ninety\s+five/gi, '495']
  ];

  for (const [regex, replacement] of spokenCompounds) {
    cleaned = cleaned.replace(regex, replacement);
  }

  // Replace standalone number words
  const words = cleaned.split(/\s+/);
  const replacedWords = words.map(w => {
    if (NUMBER_WORDS[w] !== undefined) {
      return String(NUMBER_WORDS[w]);
    }
    return w;
  });

  return replacedWords.join(' ');
}

/**
 * Parses gym speech for weight, reps, RPE, and optional exercise target.
 */
export function parseGymSpeech(
  transcript: string,
  unit: 'lbs' | 'kg',
  fallbackWeight: number = 0,
  fallbackReps: number = 10,
  availableExerciseNames: { id: string; name: string }[] = []
): ParsedGymSpeech {
  if (!transcript || !transcript.trim()) {
    return {
      rawText: transcript,
      weight: null,
      reps: null,
      confidence: 'low'
    };
  }

  const normalized = normalizeSpokenNumbers(transcript, unit);

  let matchedExerciseId: string | undefined;
  let exerciseNameQuery: string | undefined;

  // 1. Detect if any exercise name in current workout is mentioned
  for (const ex of availableExerciseNames) {
    const exNameLower = ex.name.toLowerCase();
    // Check full name or significant words
    if (normalized.includes(exNameLower)) {
      matchedExerciseId = ex.id;
      exerciseNameQuery = ex.name;
      break;
    }
    // Check first word of exercise name (e.g. "bench", "squat", "deadlift", "incline", "curl", "press")
    const firstWord = exNameLower.split(' ')[0];
    if (firstWord.length > 3 && normalized.includes(firstWord)) {
      matchedExerciseId = ex.id;
      exerciseNameQuery = ex.name;
      break;
    }
  }

  // 2. Extract RPE / RIR
  let rpe: number | undefined;
  const rpeMatch = normalized.match(/(?:rpe|@|rate|effort)\s*([1-9](?:\.[0-9])?|10)/i);
  if (rpeMatch) {
    rpe = parseFloat(rpeMatch[1]);
  } else {
    const rirMatch = normalized.match(/(?:rir|reps\s+in\s+reserve)\s*([0-4](?:\.[0-9])?)/i);
    if (rirMatch) {
      rpe = Math.max(6, 10 - parseFloat(rirMatch[1]));
    }
  }

  // 3. Check for bodyweight
  const isBodyweight = /(?:body\s*weight|bw|bodyweight|zero\s*weight|no\s*weight)/i.test(normalized);
  const isSameWeight = /(?:same\s*weight|same|repeat)/i.test(normalized);

  let weight: number | null = null;
  let reps: number | null = null;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // Pattern A: "225 for 8" or "225 lbs for 8 reps"
  const forMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?\s*(?:for|x|times)\s*(\d+)\s*(?:reps?)?/i);
  if (forMatch) {
    weight = parseFloat(forMatch[1]);
    reps = parseInt(forMatch[2], 10);
    confidence = 'high';
  }

  // Pattern B: "8 reps at 225" or "8 at 225" or "8 reps with 225"
  if (weight === null || reps === null) {
    const atMatch = normalized.match(/(\d+)\s*(?:reps?)?\s*(?:at|with)\s*(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?/i);
    if (atMatch) {
      reps = parseInt(atMatch[1], 10);
      weight = parseFloat(atMatch[2]);
      confidence = 'high';
    }
  }

  // Pattern C: "225 by 8"
  if (weight === null || reps === null) {
    const byMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*by\s*(\d+)\s*(?:reps?)?/i);
    if (byMatch) {
      weight = parseFloat(byMatch[1]);
      reps = parseInt(byMatch[2], 10);
      confidence = 'high';
    }
  }

  // Pattern D: Bodyweight with reps, e.g. "bodyweight 15 reps" or "bodyweight for 12"
  if (isBodyweight) {
    weight = 0;
    const bwRepsMatch = normalized.match(/(?:body\s*weight|bw|bodyweight)\s*(?:for\s*)?(\d+)/i);
    if (bwRepsMatch) {
      reps = parseInt(bwRepsMatch[1], 10);
      confidence = 'high';
    } else {
      reps = fallbackReps;
      confidence = 'medium';
    }
  }

  // Pattern E: "same weight 10 reps"
  if (isSameWeight && (weight === null || reps === null)) {
    weight = fallbackWeight;
    const sameRepsMatch = normalized.match(/(\d+)\s*reps?/i);
    if (sameRepsMatch) {
      reps = parseInt(sameRepsMatch[1], 10);
      confidence = 'high';
    } else {
      reps = fallbackReps;
      confidence = 'medium';
    }
  }

  // Pattern F: Explicit "reps" token e.g. "12 reps" (no weight specified)
  if (weight === null && reps === null) {
    const repsOnlyMatch = normalized.match(/(\d+)\s*reps?/i);
    if (repsOnlyMatch) {
      reps = parseInt(repsOnlyMatch[1], 10);
      weight = fallbackWeight;
      confidence = 'medium';
    }
  }

  // Pattern G: Two standalone numbers in sequence, e.g. "225 8" or "100 10"
  if (weight === null || reps === null) {
    // Strip RPE mentions first to not confuse numbers
    const cleanNumbers = normalized.replace(/rpe\s*\d+(\.\d+)?/gi, '').match(/\b\d+(?:\.\d+)?\b/g);
    if (cleanNumbers && cleanNumbers.length >= 2) {
      const num1 = parseFloat(cleanNumbers[0]);
      const num2 = parseInt(cleanNumbers[1], 10);

      // In lifting, weight is almost always >= reps
      if (num1 >= num2) {
        weight = num1;
        reps = num2;
      } else {
        weight = num2;
        reps = Math.round(num1);
      }
      confidence = 'high';
    } else if (cleanNumbers && cleanNumbers.length === 1) {
      const singleNum = parseFloat(cleanNumbers[0]);
      // If number is small (<= 30), likely reps; if large (> 30), likely weight
      if (singleNum <= 30) {
        reps = Math.round(singleNum);
        weight = fallbackWeight;
      } else {
        weight = singleNum;
        reps = fallbackReps;
      }
      confidence = 'medium';
    }
  }

  return {
    rawText: transcript,
    weight,
    reps,
    rpe,
    exerciseNameQuery,
    matchedExerciseId,
    confidence
  };
}

export class VoiceLoggerService {
  private static instance: VoiceLoggerService;

  static getInstance(): VoiceLoggerService {
    if (!VoiceLoggerService.instance) {
      VoiceLoggerService.instance = new VoiceLoggerService();
    }
    return VoiceLoggerService.instance;
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android' || !LiftSpeech) return false;
    try {
      return await LiftSpeech.isAvailable();
    } catch {
      return false;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (granted) return true;

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'L!FT needs microphone access to log your sets with your voice completely on-device.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel'
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }

  startListening(
    callbacks: {
      onReady?: () => void;
      onBeginning?: () => void;
      onPartialResults?: (text: string) => void;
      onRmsChanged?: (rms: number) => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
      onResults?: (text: string, allMatches: string[]) => void;
    }
  ): Promise<boolean> {
    if (Platform.OS !== 'android' || !LiftSpeech) {
      return Promise.reject(new Error('Speech recognition only supported on Android'));
    }

    // Clean up previous listeners
    this.removeListeners();

    // Register event listeners
    if (callbacks.onReady) {
      this.subReady = DeviceEventEmitter.addListener('onSpeechReady', callbacks.onReady);
    }
    if (callbacks.onBeginning) {
      this.subBeginning = DeviceEventEmitter.addListener('onSpeechBeginning', callbacks.onBeginning);
    }
    if (callbacks.onPartialResults) {
      this.subPartial = DeviceEventEmitter.addListener('onSpeechPartialResults', (data) => {
        callbacks.onPartialResults?.(data?.text || '');
      });
    }
    if (callbacks.onRmsChanged) {
      this.subRms = DeviceEventEmitter.addListener('onSpeechRmsChanged', (data) => {
        callbacks.onRmsChanged?.(data?.rms ?? 0);
      });
    }
    if (callbacks.onEnd) {
      this.subEnd = DeviceEventEmitter.addListener('onSpeechEnd', callbacks.onEnd);
    }
    if (callbacks.onError) {
      this.subError = DeviceEventEmitter.addListener('onSpeechError', (data) => {
        callbacks.onError?.(data?.message || 'Speech recognition error');
      });
    }
    if (callbacks.onResults) {
      this.subResults = DeviceEventEmitter.addListener('onSpeechResults', (data) => {
        const text = data?.text || '';
        const matches = data?.results || [];
        callbacks.onResults?.(text, matches);
      });
    }

    return LiftSpeech.startListening();
  }

  async stopListening(): Promise<boolean> {
    if (Platform.OS !== 'android' || !LiftSpeech) return false;
    try {
      await LiftSpeech.stopListening();
      return true;
    } catch {
      return false;
    }
  }

  async cancelListening(): Promise<boolean> {
    if (Platform.OS !== 'android' || !LiftSpeech) return false;
    try {
      this.removeListeners();
      await LiftSpeech.cancelListening();
      return true;
    } catch {
      return false;
    }
  }

  private subReady: any = null;
  private subBeginning: any = null;
  private subPartial: any = null;
  private subRms: any = null;
  private subEnd: any = null;
  private subError: any = null;
  private subResults: any = null;

  removeListeners() {
    this.subReady?.remove();
    this.subBeginning?.remove();
    this.subPartial?.remove();
    this.subRms?.remove();
    this.subEnd?.remove();
    this.subError?.remove();
    this.subResults?.remove();
  }
}
