export interface CardioExerciseConfig {
  id: string;
  name: string;
  emoji: string;
}

export const CARDIO_EXERCISES: CardioExerciseConfig[] = [
  { id: "running", name: "Running", emoji: "🏃" },
  { id: "cycling", name: "Cycling", emoji: "🚴" },
  { id: "swimming", name: "Swimming", emoji: "🏊" },
  { id: "rowing", name: "Rowing", emoji: "🚣" },
  { id: "walking", name: "Walking", emoji: "🚶" },
  { id: "hiking", name: "Hiking", emoji: "🥾" },
];

export function getCardioExercise(id: string): CardioExerciseConfig | undefined {
  return CARDIO_EXERCISES.find((e) => e.id === id);
}
