export type UserId = "alex" | "dan" | "quentin";

export interface AppData {
  version: 1;
  activeUser: UserId | null;
  users: Record<UserId, User>;
  entries: WorkoutEntry[];
  customExercises: ExerciseConfig[];
}

export interface User {
  id: UserId;
  name: string;
  bodyWeights: BodyWeight[];
}

export interface BodyWeight {
  month: string;
  weight: number;
}

export interface WorkoutEntry {
  id: string;
  userId: UserId;
  exercise: string;
  month: string;
  week: number;
  date: string;
  reps: number;
  sets: number;
  weight: number;
  maxReps: number;
  notes: string;
  createdAt: string;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  usesBodyWeight: boolean;
  substitution?: string;
  isOptional: boolean;
  isCustom?: boolean;
}
