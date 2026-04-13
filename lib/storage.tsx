"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import type { AppData, UserId, WorkoutEntry, User, ExerciseConfig } from "@/types";
import { getDefaultUsers } from "./constants";
import { getSeedData } from "./seed-data";
import { EXERCISES } from "./exercises";

const STORAGE_KEY = "lift-tracker-data";

function getDefaultData(): AppData {
  return {
    version: 1,
    activeUser: null,
    users: getDefaultUsers(),
    entries: [],
    customExercises: [],
  };
}

function loadData(): AppData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    return JSON.parse(raw) as AppData;
  } catch {
    return getDefaultData();
  }
}

function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface AppContextValue {
  data: AppData;
  activeUser: User | null;
  setActiveUser: (id: UserId) => void;
  addEntry: (entry: Omit<WorkoutEntry, "id" | "createdAt">) => void;
  updateEntry: (id: string, updates: Partial<WorkoutEntry>) => void;
  deleteEntry: (id: string) => void;
  setBodyWeight: (userId: UserId, month: string, weight: number) => void;
  getBodyWeight: (userId: UserId, month: string) => number;
  getEntries: (filters: {
    userId?: UserId;
    exercise?: string;
    month?: string;
    week?: number;
  }) => WorkoutEntry[];
  getLastEntry: (userId: UserId, exercise: string, month: string, week: number) => WorkoutEntry | undefined;
  addCustomExercise: (exercise: ExerciseConfig) => void;
  removeCustomExercise: (id: string) => void;
  getAllExercises: () => ExerciseConfig[];
  exportData: () => string;
  importData: (json: string) => boolean;
  loadSeedData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(getDefaultData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadData());
    setLoaded(true);
  }, []);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  const setActiveUser = useCallback(
    (id: UserId) => {
      persist((d) => ({ ...d, activeUser: id }));
    },
    [persist]
  );

  const addEntry = useCallback(
    (entry: Omit<WorkoutEntry, "id" | "createdAt">) => {
      persist((d) => ({
        ...d,
        entries: [
          ...d.entries,
          { ...entry, id: nanoid(), createdAt: new Date().toISOString() },
        ],
      }));
    },
    [persist]
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<WorkoutEntry>) => {
      persist((d) => ({
        ...d,
        entries: d.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
    },
    [persist]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      persist((d) => ({
        ...d,
        entries: d.entries.filter((e) => e.id !== id),
      }));
    },
    [persist]
  );

  const setBodyWeight = useCallback(
    (userId: UserId, month: string, weight: number) => {
      persist((d) => {
        const user = d.users[userId];
        const existing = user.bodyWeights.findIndex((b) => b.month === month);
        const bodyWeights =
          existing >= 0
            ? user.bodyWeights.map((b, i) => (i === existing ? { month, weight } : b))
            : [...user.bodyWeights, { month, weight }];
        return {
          ...d,
          users: { ...d.users, [userId]: { ...user, bodyWeights } },
        };
      });
    },
    [persist]
  );

  const getBodyWeight = useCallback(
    (userId: UserId, month: string): number => {
      const user = data.users[userId];
      if (!user) return 0;
      // Find exact month match first, then most recent before this month
      const exact = user.bodyWeights.find((b) => b.month === month);
      if (exact) return exact.weight;
      const sorted = [...user.bodyWeights]
        .filter((b) => b.month <= month)
        .sort((a, b) => b.month.localeCompare(a.month));
      return sorted[0]?.weight ?? 0;
    },
    [data]
  );

  const getEntries = useCallback(
    (filters: {
      userId?: UserId;
      exercise?: string;
      month?: string;
      week?: number;
    }): WorkoutEntry[] => {
      return data.entries.filter((e) => {
        if (filters.userId && e.userId !== filters.userId) return false;
        if (filters.exercise && e.exercise !== filters.exercise) return false;
        if (filters.month && e.month !== filters.month) return false;
        if (filters.week && e.week !== filters.week) return false;
        return true;
      });
    },
    [data]
  );

  const getLastEntry = useCallback(
    (userId: UserId, exercise: string, month: string, week: number): WorkoutEntry | undefined => {
      // Try previous week same month
      if (week > 1) {
        const prev = data.entries.find(
          (e) => e.userId === userId && e.exercise === exercise && e.month === month && e.week === week - 1
        );
        if (prev) return prev;
      }
      // Try last week of previous month
      const [y, m] = month.split("-").map(Number);
      const prevMonth = m === 1
        ? `${y - 1}-12`
        : `${y}-${String(m - 1).padStart(2, "0")}`;
      const prevMonthEntries = data.entries
        .filter((e) => e.userId === userId && e.exercise === exercise && e.month === prevMonth)
        .sort((a, b) => b.week - a.week);
      return prevMonthEntries[0];
    },
    [data]
  );

  const exportData = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importData = useCallback(
    (json: string): boolean => {
      try {
        const parsed = JSON.parse(json) as AppData;
        if (parsed.version !== 1) return false;
        saveData(parsed);
        setData(parsed);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const addCustomExercise = useCallback(
    (exercise: ExerciseConfig) => {
      persist((d) => ({
        ...d,
        customExercises: [...(d.customExercises || []), exercise],
      }));
    },
    [persist]
  );

  const removeCustomExercise = useCallback(
    (id: string) => {
      persist((d) => ({
        ...d,
        customExercises: (d.customExercises || []).filter((e) => e.id !== id),
      }));
    },
    [persist]
  );

  const getAllExercises = useCallback((): ExerciseConfig[] => {
    return [...EXERCISES, ...(data.customExercises || [])];
  }, [data.customExercises]);

  const loadSeedData = useCallback(() => {
    const seed = getSeedData();
    saveData(seed);
    setData(seed);
  }, []);

  const activeUser = data.activeUser ? data.users[data.activeUser] : null;

  if (!loaded) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        data,
        activeUser,
        setActiveUser,
        addEntry,
        updateEntry,
        deleteEntry,
        setBodyWeight,
        getBodyWeight,
        getEntries,
        getLastEntry,
        exportData,
        addCustomExercise,
        removeCustomExercise,
        getAllExercises,
        importData,
        loadSeedData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
