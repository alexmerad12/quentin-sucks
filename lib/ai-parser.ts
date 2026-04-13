import { EXERCISES } from "./exercises";
import type { ExerciseConfig } from "@/types";

interface ParsedWorkout {
  exercise: string | null;
  reps: number | null;
  sets: number | null;
  weight: number | null;
  maxReps: number | null;
  notes: string;
  confidence: number;
}

const EXERCISE_ALIASES: Record<string, string> = {
  // Squat
  squat: "squat",
  squats: "squat",
  "back squat": "squat",
  "back squats": "squat",
  // Deadlift
  deadlift: "deadlift",
  deadlifts: "deadlift",
  dl: "deadlift",
  deads: "deadlift",
  // Bench
  bench: "bench",
  "bench press": "bench",
  "flat bench": "bench",
  "db press": "bench",
  "dumbbell press": "bench",
  "flat dumbbell press": "bench",
  // OHP
  ohp: "ohp",
  "overhead press": "ohp",
  "shoulder press": "ohp",
  "military press": "ohp",
  "sitting ohp": "ohp",
  press: "ohp",
  // Pull-ups
  pullups: "pullups",
  "pull ups": "pullups",
  "pull-ups": "pullups",
  pullup: "pullups",
  "pull up": "pullups",
  "pull-up": "pullups",
  chinups: "pullups",
  "chin ups": "pullups",
  "chin-ups": "pullups",
  // Dips
  dips: "dips",
  dip: "dips",
  // Leg Press
  "leg press": "leg-press",
  legpress: "leg-press",
  "leg-press": "leg-press",
};

function matchExercise(text: string, customExercises?: ExerciseConfig[]): string | null {
  const lower = text.toLowerCase();

  // Check aliases first (longest match wins)
  const sortedAliases = Object.entries(EXERCISE_ALIASES).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [alias, id] of sortedAliases) {
    if (lower.includes(alias)) return id;
  }

  // Check custom exercises
  if (customExercises) {
    for (const ex of customExercises) {
      if (lower.includes(ex.name.toLowerCase()) || lower.includes(ex.id)) {
        return ex.id;
      }
    }
  }

  return null;
}

function extractNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

export function parseWorkoutText(
  text: string,
  customExercises?: ExerciseConfig[]
): ParsedWorkout {
  const lower = text.toLowerCase().trim();

  const exercise = matchExercise(lower, customExercises);

  // Extract reps
  const reps = extractNumber(lower, [
    /(\d+)\s*reps/,
    /(\d+)\s*r\b/,
    /for\s+(\d+)/,
    /x\s*(\d+)(?!\s*(?:lbs?|pounds?))/,    // 3x8 → 8 reps (if not followed by lbs)
    /did\s+(\d+)/,
  ]);

  // Extract sets
  const sets = extractNumber(lower, [
    /(\d+)\s*sets?/,
    /(\d+)\s*s\b/,
    /(\d+)\s*x/,    // 3x8 → 3 sets
  ]);

  // Extract weight
  const weight = extractNumber(lower, [
    /(\d+)\s*(?:lbs?|pounds?)/,
    /(\d+)\s*(?:kg|kilos?)/,
    /(?:at|@)\s*(\d+)/,
    /weight[:\s]+(\d+)/,
  ]);

  // Notes: anything after "note:" or in parentheses
  let notes = "";
  const noteMatch = lower.match(/(?:note[s]?[:\s]+|[(-])(.+?)(?:[)-]|$)/);
  if (noteMatch) notes = noteMatch[1].trim();

  // Confidence: how much did we parse?
  let confidence = 0;
  if (exercise) confidence += 0.4;
  if (reps) confidence += 0.2;
  if (sets) confidence += 0.15;
  if (weight) confidence += 0.25;

  return {
    exercise,
    reps,
    sets,
    weight,
    maxReps: reps, // Default max reps to reps
    notes,
    confidence,
  };
}

export function generateSuggestion(parsed: ParsedWorkout): string {
  const parts: string[] = [];

  if (parsed.exercise) {
    const ex = [...EXERCISES].find((e) => e.id === parsed.exercise);
    parts.push(ex?.name ?? parsed.exercise);
  }

  if (parsed.sets && parsed.reps) {
    parts.push(`${parsed.sets} sets x ${parsed.reps} reps`);
  } else if (parsed.reps) {
    parts.push(`${parsed.reps} reps`);
  }

  if (parsed.weight) {
    parts.push(`@ ${parsed.weight} lbs`);
  }

  return parts.join(" — ") || "Could not parse workout";
}
