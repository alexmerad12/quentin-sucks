import type { WorkoutEntry, ExerciseConfig } from "@/types";
import { getExercise } from "./exercises";

export function getEffectiveWeight(
  entry: WorkoutEntry,
  bodyWeight: number,
  customExercises?: ExerciseConfig[]
): number {
  const exercise = getExercise(entry.exercise, customExercises);
  if (exercise?.usesBodyWeight) {
    return bodyWeight + entry.weight;
  }
  return entry.weight;
}

export function calcVolume(
  entry: WorkoutEntry,
  bodyWeight: number,
  customExercises?: ExerciseConfig[]
): number {
  const effectiveWeight = getEffectiveWeight(entry, bodyWeight, customExercises);
  return entry.reps * entry.sets * effectiveWeight;
}

export function calcMaxRepsVol(
  entry: WorkoutEntry,
  bodyWeight: number,
  customExercises?: ExerciseConfig[]
): number {
  const effectiveWeight = getEffectiveWeight(entry, bodyWeight, customExercises);
  return entry.maxReps * effectiveWeight;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentWeek(): number {
  const day = new Date().getDate();
  return Math.ceil(day / 7);
}

export function getWeeksInMonth(month: string): number[] {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const weekCount = Math.ceil(daysInMonth / 7);
  return Array.from({ length: weekCount }, (_, i) => i + 1);
}

export function getWeekDateRange(month: string, week: number): string {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const start = (week - 1) * 7 + 1;
  const end = Math.min(week * 7, daysInMonth);
  return `${start}–${end}`;
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export interface PRRecord {
  type: "weight" | "volume" | "maxRepsVol";
  value: number;
  entryId: string;
}

export function detectPRs(
  entry: WorkoutEntry,
  allEntries: WorkoutEntry[],
  bodyWeight: number,
  customExercises?: ExerciseConfig[]
): PRRecord[] {
  const prs: PRRecord[] = [];
  const sameExercise = allEntries.filter(
    (e) => e.userId === entry.userId && e.exercise === entry.exercise && e.id !== entry.id
  );

  const effectiveWeight = getEffectiveWeight(entry, bodyWeight, customExercises);
  const volume = calcVolume(entry, bodyWeight, customExercises);
  const maxRepsVol = calcMaxRepsVol(entry, bodyWeight, customExercises);

  const maxWeight = Math.max(0, ...sameExercise.map((e) => getEffectiveWeight(e, bodyWeight, customExercises)));
  const maxVolume = Math.max(0, ...sameExercise.map((e) => calcVolume(e, bodyWeight, customExercises)));
  const maxMRV = Math.max(0, ...sameExercise.map((e) => calcMaxRepsVol(e, bodyWeight, customExercises)));

  if (effectiveWeight > maxWeight) {
    prs.push({ type: "weight", value: effectiveWeight, entryId: entry.id });
  }
  if (volume > maxVolume) {
    prs.push({ type: "volume", value: volume, entryId: entry.id });
  }
  if (maxRepsVol > maxMRV) {
    prs.push({ type: "maxRepsVol", value: maxRepsVol, entryId: entry.id });
  }

  return prs;
}
