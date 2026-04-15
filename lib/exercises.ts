import type { ExerciseConfig } from "@/types";

export const EXERCISES: ExerciseConfig[] = [
  { id: "squat", name: "Squat", usesBodyWeight: false, isOptional: false, category: "Squat" },
  { id: "deadlift", name: "Deadlift", usesBodyWeight: false, isOptional: false, category: "Deadlift" },
  {
    id: "bench",
    name: "Bench Press",
    usesBodyWeight: false,
    substitution: "Flat dumbbell press",
    isOptional: false,
    category: "Bench",
  },
  {
    id: "ohp",
    name: "OHP",
    usesBodyWeight: false,
    substitution: "Sitting OHP w/ dumbbells (no back rest)",
    isOptional: false,
    category: "Shoulder Press",
  },
  { id: "pullups", name: "Pull-ups", usesBodyWeight: true, isOptional: false, category: "Pull-ups" },
  { id: "dips", name: "Dips", usesBodyWeight: true, isOptional: false, category: "Dips" },
  { id: "leg-press", name: "Leg Press", usesBodyWeight: false, isOptional: true, category: "Leg Press" },
];

export function getExercise(id: string, customExercises?: ExerciseConfig[]): ExerciseConfig | undefined {
  const found = EXERCISES.find((e) => e.id === id);
  if (found) return found;
  return customExercises?.find((e) => e.id === id);
}

// Categories should group exercises that are the SAME movement (barbell vs dumbbell).
// Different movements (rows vs pull-ups vs lat pulldown) get separate categories.
const CATEGORY_KEYWORDS: [string, string][] = [
  // Bench variants (barbell bench, dumbbell bench, incline bench)
  ["bench press", "Bench"],
  ["bench", "Bench"],
  ["chest press", "Bench"],
  // Squat variants
  ["squat", "Squat"],
  // Deadlift variants
  ["deadlift", "Deadlift"],
  // Shoulder press variants (OHP, dumbbell shoulder press, military press)
  ["shoulder press", "Shoulder Press"],
  ["ohp", "Shoulder Press"],
  ["overhead press", "Shoulder Press"],
  ["military press", "Shoulder Press"],
  // Pull-ups / chin-ups (bodyweight vertical pull)
  ["pull-up", "Pull-ups"],
  ["pullup", "Pull-ups"],
  ["chin-up", "Pull-ups"],
  ["chin up", "Pull-ups"],
  // Rows (horizontal pull — barbell row, dumbbell row, cable row)
  ["row", "Rows"],
  // Lat pulldown (cable vertical pull)
  ["lat pulldown", "Lat Pulldown"],
  ["pulldown", "Lat Pulldown"],
  // Dips (bodyweight push)
  ["bench dip", "Dips"],
  ["dip", "Dips"],
  // Tricep isolation
  ["kickback", "Triceps"],
  ["tricep", "Triceps"],
  ["skull crusher", "Triceps"],
  // Push-ups
  ["push-up", "Push-ups"],
  ["pushup", "Push-ups"],
  // Legs
  ["leg press", "Leg Press"],
  ["leg curl", "Leg Curl"],
  ["lunge", "Lunges"],
  ["calf", "Calves"],
  // Bicep / curls
  ["curl", "Curls"],
  ["bicep", "Curls"],
  // Raises (shoulders)
  ["lateral raise", "Raises"],
  ["front raise", "Raises"],
  ["raise", "Raises"],
  // Core
  ["crunch", "Core"],
  ["plank", "Core"],
  ["sit-up", "Core"],
  ["ab", "Core"],
];

export function inferCategory(exercise: ExerciseConfig): string {
  if (exercise.category) return exercise.category;
  const lower = exercise.name.toLowerCase();
  for (const [keyword, category] of CATEGORY_KEYWORDS) {
    if (lower.includes(keyword)) return category;
  }
  return "Other";
}
