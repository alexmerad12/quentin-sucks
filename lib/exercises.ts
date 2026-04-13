import type { ExerciseConfig } from "@/types";

export const EXERCISES: ExerciseConfig[] = [
  { id: "squat", name: "Squat", usesBodyWeight: false, isOptional: false },
  { id: "deadlift", name: "Deadlift", usesBodyWeight: false, isOptional: false },
  {
    id: "bench",
    name: "Bench Press",
    usesBodyWeight: false,
    substitution: "Flat dumbbell press",
    isOptional: false,
  },
  {
    id: "ohp",
    name: "OHP",
    usesBodyWeight: false,
    substitution: "Sitting OHP w/ dumbbells (no back rest)",
    isOptional: false,
  },
  { id: "pullups", name: "Pull-ups", usesBodyWeight: true, isOptional: false },
  { id: "dips", name: "Dips", usesBodyWeight: true, isOptional: false },
  { id: "leg-press", name: "Leg Press", usesBodyWeight: false, isOptional: true },
];

export function getExercise(id: string, customExercises?: ExerciseConfig[]): ExerciseConfig | undefined {
  const found = EXERCISES.find((e) => e.id === id);
  if (found) return found;
  return customExercises?.find((e) => e.id === id);
}
