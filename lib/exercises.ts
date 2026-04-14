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
  { id: "pullups", name: "Pull-ups", usesBodyWeight: true, isOptional: false, category: "Pull" },
  { id: "dips", name: "Dips", usesBodyWeight: true, isOptional: false, category: "Push" },
  { id: "leg-press", name: "Leg Press", usesBodyWeight: false, isOptional: true, category: "Legs" },
];

export function getExercise(id: string, customExercises?: ExerciseConfig[]): ExerciseConfig | undefined {
  const found = EXERCISES.find((e) => e.id === id);
  if (found) return found;
  return customExercises?.find((e) => e.id === id);
}

const CATEGORY_KEYWORDS: [string, string][] = [
  ["bench", "Bench"],
  ["chest", "Bench"],
  ["squat", "Squat"],
  ["deadlift", "Deadlift"],
  ["shoulder", "Shoulder Press"],
  ["ohp", "Shoulder Press"],
  ["overhead", "Shoulder Press"],
  ["military", "Shoulder Press"],
  ["pull-up", "Pull"],
  ["pullup", "Pull"],
  ["chin", "Pull"],
  ["row", "Pull"],
  ["lat", "Pull"],
  ["dip", "Push"],
  ["push", "Push"],
  ["tricep", "Push"],
  ["leg press", "Legs"],
  ["lunge", "Legs"],
  ["leg", "Legs"],
  ["calf", "Legs"],
  ["curl", "Arms"],
  ["bicep", "Arms"],
];

export function inferCategory(exercise: ExerciseConfig): string {
  if (exercise.category) return exercise.category;
  const lower = exercise.name.toLowerCase();
  for (const [keyword, category] of CATEGORY_KEYWORDS) {
    if (lower.includes(keyword)) return category;
  }
  return "Other";
}
