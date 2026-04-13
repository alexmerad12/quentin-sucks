"use client";

import { useApp } from "@/lib/storage";
import { getEffectiveWeight, detectPRs } from "@/lib/calculations";
import { Trophy, Activity } from "lucide-react";

export function ActivityFeed() {
  const { data, getBodyWeight, getAllExercises } = useApp();
  const exercises = getAllExercises();

  const recentEntries = [...data.entries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 15);

  if (recentEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
        <Activity className="mx-auto mb-3 h-6 w-6 text-white/20" />
        <p className="text-sm text-white/30">No workouts yet</p>
        <p className="text-xs text-white/15 mt-1">Hit the Log tab to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-white/30 tracking-widest uppercase px-1">
        Recent Activity
      </h2>
      <div className="space-y-1.5">
        {recentEntries.map((entry) => {
          const user = data.users[entry.userId];
          const exercise = exercises.find((e) => e.id === entry.exercise);
          const bodyWeight = getBodyWeight(entry.userId, entry.month);
          const effectiveWt = getEffectiveWeight(entry, bodyWeight, data.customExercises || []);
          const prs = detectPRs(entry, data.entries, bodyWeight, data.customExercises || []);
          const hasPR = prs.length > 0;

          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                hasPR
                  ? "bg-yellow-500/5 border border-yellow-500/10"
                  : "bg-white/[0.02] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  hasPR
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-white/5 text-white/40"
                }`}>
                  {hasPR ? <Trophy className="h-3.5 w-3.5" /> : user?.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{user?.name}</span>
                    <span className="text-xs text-white/20">·</span>
                    <span className="text-xs text-primary/80">{exercise?.name ?? entry.exercise}</span>
                  </div>
                  <div className="text-xs text-white/30">
                    {entry.reps}r × {entry.sets}s × {effectiveWt}lbs
                    {entry.notes && (
                      <span className="ml-1 italic text-white/15">— {entry.notes}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-white/20 font-mono">
                WK{entry.week}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
