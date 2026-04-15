"use client";

import { useApp } from "@/lib/storage";
import { calcVolume, calcMaxRepsVol, getEffectiveWeight, getWeeksInMonth } from "@/lib/calculations";
import type { UserId, WorkoutEntry } from "@/types";
import { Trash2 } from "lucide-react";

interface WeeklyTableProps {
  exerciseId: string;
  userId: UserId;
  month: string;
}

function EntryCard({ entry, bodyWeight, usesBodyWeight, onDelete }: {
  entry: WorkoutEntry;
  bodyWeight: number;
  usesBodyWeight: boolean;
  onDelete: () => void;
}) {
  const effectiveWt = getEffectiveWeight(entry, bodyWeight);
  const volume = calcVolume(entry, bodyWeight);

  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/5 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary">WK {entry.week}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30">{entry.date}</span>
          <button
            onClick={onDelete}
            className="flex h-5 w-5 items-center justify-center rounded text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="text-base font-bold text-white">
        {entry.reps} reps × {entry.sets} sets × {usesBodyWeight ? effectiveWt : entry.weight} lbs
      </div>
      <div className="text-xs text-white/40">
        Volume: {volume.toLocaleString()} lbs
      </div>
      {entry.notes && !entry.notes.startsWith("AI:") && (
        <div className="text-xs text-white/25 italic">{entry.notes}</div>
      )}
    </div>
  );
}

export function WeeklyTable({ exerciseId, userId, month }: WeeklyTableProps) {
  const { getEntries, getBodyWeight, getAllExercises, deleteEntry } = useApp();
  const allExercises = getAllExercises();
  const exercise = allExercises.find((e) => e.id === exerciseId);
  const bodyWeight = getBodyWeight(userId, month);

  const entries = getEntries({ userId, exercise: exerciseId, month });
  const sorted = [...entries].sort((a, b) => a.week - b.week);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm font-bold text-white">{exercise?.name}</span>
        <div className="flex items-center gap-2">
          {exercise?.isOptional && (
            <span className="text-[10px] text-white/20">optional</span>
          )}
          {sorted.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {sorted.length} entries
            </span>
          )}
        </div>
      </div>
      {sorted.length > 0 ? (
        <div className="p-3 space-y-2">
          {sorted.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              bodyWeight={bodyWeight}
              usesBodyWeight={exercise?.usesBodyWeight ?? false}
              onDelete={() => { if (confirm("Delete this entry?")) deleteEntry(entry.id); }}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-xs text-white/15">
          No entries this month
        </div>
      )}
    </div>
  );
}
