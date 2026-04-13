import type { AppData, WorkoutEntry } from "@/types";
import { getDefaultUsers } from "./constants";

let idCounter = 0;
function makeId(): string {
  return `seed-${++idCounter}`;
}

function entry(
  userId: "alex" | "dan" | "quentin",
  exercise: string,
  week: 1 | 2 | 3 | 4 | 5,
  date: string,
  reps: number,
  sets: number,
  weight: number,
  maxReps: number,
  notes: string
): WorkoutEntry {
  return {
    id: makeId(),
    userId,
    exercise,
    month: "2024-11",
    week,
    date,
    reps,
    sets,
    weight,
    maxReps,
    notes,
    createdAt: new Date(`2024-11-${String(week * 7).padStart(2, "0")}T12:00:00Z`).toISOString(),
  };
}

export function getSeedData(): AppData {
  idCounter = 0;
  const users = getDefaultUsers();
  // Set body weights from spreadsheet
  users.alex.bodyWeights = [{ month: "2024-11", weight: 200 }];
  users.dan.bodyWeights = [{ month: "2024-11", weight: 185 }];

  const entries: WorkoutEntry[] = [
    // ALEX - Squats
    entry("alex", "squat", 1, "2024-11-05", 6, 2, 225, 6, "Not good position, need to lower weight and take a shit"),
    entry("alex", "squat", 2, "2024-11-12", 10, 2, 185, 10, "working on form"),
    // DAN - Squats
    entry("dan", "squat", 1, "2024-11-03", 5, 3, 225, 5, ""),
    entry("dan", "squat", 2, "2024-11-12", 5, 2, 265, 5, "jesus"),
    // QUENTIN - Squats
    entry("quentin", "squat", 1, "2024-11-07", 6, 2, 220, 6, ""),
    entry("quentin", "squat", 2, "2024-11-10", 7, 2, 225, 7, ""),

    // ALEX - Deadlifts
    entry("alex", "deadlift", 1, "2024-11-03", 5, 5, 225, 5, ""),
    entry("alex", "deadlift", 2, "2024-11-12", 6, 2, 275, 6, "working on form"),
    entry("alex", "deadlift", 3, "2024-11-18", 5, 2, 285, 5, ""),
    // DAN - Deadlifts
    entry("dan", "deadlift", 1, "2024-11-03", 5, 2, 275, 5, "Switch grip"),
    // QUENTIN - Deadlifts
    entry("quentin", "deadlift", 1, "2024-11-03", 8, 2, 260, 8, "wtb more weight"),

    // ALEX - Bench Press
    entry("alex", "bench", 1, "2024-11-04", 5, 2, 160, 5, ""),
    entry("alex", "bench", 2, "2024-11-12", 20, 2, 100, 20, ""),
    entry("alex", "bench", 3, "2024-11-17", 22, 3, 100, 22, ""),
    // DAN - Bench Press
    entry("dan", "bench", 1, "2024-11-03", 5, 2, 205, 5, "the fuck"),
    entry("dan", "bench", 2, "2024-11-12", 20, 2, 100, 26, "26 - 20 reps"),
    // QUENTIN - Bench Press
    entry("quentin", "bench", 1, "2024-11-05", 15, 2, 100, 15, "db press"),
    entry("quentin", "bench", 2, "2024-11-10", 17, 2, 100, 17, ""),

    // ALEX - OHP
    entry("alex", "ohp", 1, "2024-11-08", 5, 1, 100, 5, ""),
    entry("alex", "ohp", 2, "2024-11-12", 5, 2, 100, 5, ""),
    // DAN - OHP
    entry("dan", "ohp", 1, "2024-11-03", 5, 2, 115, 5, ""),
    entry("dan", "ohp", 2, "2024-11-15", 5, 2, 120, 5, ""),
    // QUENTIN - OHP
    entry("quentin", "ohp", 1, "2024-11-03", 5, 2, 120, 5, "PR"),

    // ALEX - Pull-ups (weight = additional weight, bodyweight auto-added)
    entry("alex", "pullups", 1, "2024-11-04", 5, 2, 2, 5, ""),  // 200+2=202 effective
    entry("alex", "pullups", 2, "2024-11-17", 5, 3, 2, 5, ""),
    // DAN - Pull-ups
    entry("dan", "pullups", 1, "2024-11-03", 9, 2, 0, 9, ""),  // 185 effective
    entry("dan", "pullups", 2, "2024-11-12", 11, 2, 0, 11, ""),
    // QUENTIN - Pull-ups
    entry("quentin", "pullups", 1, "2024-11-05", 8, 2, 35, 8, "bw + 35"),
    entry("quentin", "pullups", 2, "2024-11-10", 7, 2, 45, 7, "45"),

    // ALEX - Dips (weight = additional weight)
    entry("alex", "dips", 1, "2024-11-04", 15, 4, 2, 20, "the fuck"),  // 200+2=202
    entry("alex", "dips", 2, "2024-11-17", 12, 4, 2, 12, ""),
    // DAN - Dips
    entry("dan", "dips", 1, "2024-11-03", 13, 1, 0, 13, ""),
    entry("dan", "dips", 2, "2024-11-15", 10, 2, 0, 10, ""),
    // QUENTIN - Dips
    entry("quentin", "dips", 1, "2024-11-07", 10, 2, 50, 10, "bw + 50"),

    // ALEX - Leg Press (optional)
    entry("alex", "leg-press", 1, "2024-11-03", 15, 4, 275, 30, ""),
    entry("alex", "leg-press", 2, "2024-11-18", 10, 2, 345, 10, ""),
    // DAN - Leg Press
    entry("dan", "leg-press", 2, "2024-11-12", 10, 3, 275, 30, ""),
  ];

  return {
    version: 1,
    activeUser: null,
    users,
    entries,
    customExercises: [],
  };
}
