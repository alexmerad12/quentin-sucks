"use client";

import { useApp } from "@/lib/storage";
import { calcVolume, calcMaxRepsVol, getEffectiveWeight } from "@/lib/calculations";
import type { UserId, WorkoutEntry } from "@/types";
import { getWeeksInMonth } from "@/lib/calculations";

interface WeeklyTableProps {
  exerciseId: string;
  userId: UserId;
  month: string;
}

function EntryCell({ entry, bodyWeight, usesBodyWeight }: { entry?: WorkoutEntry; bodyWeight: number; usesBodyWeight: boolean }) {
  if (!entry) {
    return (
      <td className="px-2 py-2 text-center text-[10px] text-white/10">—</td>
    );
  }

  const effectiveWt = getEffectiveWeight(entry, bodyWeight);
  const volume = calcVolume(entry, bodyWeight);
  const maxRepsVol = calcMaxRepsVol(entry, bodyWeight);

  return (
    <td className="px-2 py-2">
      <div className="space-y-0.5 text-[11px]">
        <div className="font-semibold text-white">{entry.date.split("-").slice(1).join("/")}</div>
        <div className="text-white/50">
          {entry.reps}r × {entry.sets}s × {usesBodyWeight ? effectiveWt : entry.weight}
        </div>
        <div className="text-white/25">V:{volume.toLocaleString()}</div>
        {entry.notes && (
          <div className="text-white/15 italic truncate max-w-[70px]">{entry.notes}</div>
        )}
      </div>
    </td>
  );
}

export function WeeklyTable({ exerciseId, userId, month }: WeeklyTableProps) {
  const { getEntries, getBodyWeight, getAllExercises } = useApp();
  const allExercises = getAllExercises();
  const exercise = allExercises.find((e) => e.id === exerciseId);
  const bodyWeight = getBodyWeight(userId, month);
  const weeks = getWeeksInMonth(month);

  const entries = getEntries({ userId, exercise: exerciseId, month });
  const byWeek: Record<number, WorkoutEntry> = {};
  for (const e of entries) {
    byWeek[e.week] = e;
  }

  const hasData = entries.length > 0;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <span className="text-sm font-semibold text-white">{exercise?.name}</span>
        {exercise?.isOptional && (
          <span className="text-[10px] text-white/20">optional</span>
        )}
      </div>
      {hasData ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {weeks.map((w) => (
                  <th key={w} className="px-2 py-2 text-center text-[10px] font-medium text-white/30 uppercase tracking-wider">
                    WK{w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {weeks.map((w) => (
                  <EntryCell
                    key={w}
                    entry={byWeek[w]}
                    bodyWeight={bodyWeight}
                    usesBodyWeight={exercise?.usesBodyWeight ?? false}
                  />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-xs text-white/15">
          No entries this month
        </div>
      )}
    </div>
  );
}
