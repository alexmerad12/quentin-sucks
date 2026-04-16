"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { USER_LIST } from "@/lib/constants";
import { CARDIO_EXERCISES, getCardioExercise } from "@/lib/cardio-exercises";
import { calcMinPerKm, formatPace, formatDuration } from "@/lib/cardio-calculations";
import type { UserId, CardioEntry } from "@/types";
import { Trophy, MapPin, Zap, Flame, ChevronRight, ChevronDown } from "lucide-react";

const RANK_STYLES = [
  { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { color: "text-gray-400", bg: "bg-white/5", border: "border-white/10" },
  { color: "text-amber-600", bg: "bg-amber-500/5", border: "border-amber-500/10" },
];

function CategorySection({ icon, title, children, accent }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden ${accent ?? ""}`}>
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        {icon}
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      <div className="p-3 space-y-1.5">{children}</div>
    </div>
  );
}

export function CardioLeaderboard({ month }: { month: string }) {
  const { getCardioEntries } = useApp();
  const [expandedSolo, setExpandedSolo] = useState<Set<string>>(new Set());

  const toggleSolo = (id: string) => {
    setExpandedSolo((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isAllTime = !month;
  const userStats = USER_LIST.map((u) => {
    const userId = u.id as UserId;
    const allEntries = isAllTime
      ? getCardioEntries({ userId })
      : getCardioEntries({ userId, month });
    const totalDistance = allEntries.reduce((s, e) => s + e.distance, 0);
    const totalDuration = allEntries.reduce((s, e) => s + e.duration, 0);

    // Best pace — only entries >= 1km to avoid gaming with sprints
    let bestPace = Infinity;
    let bestPaceEntry: CardioEntry | null = null;
    for (const e of allEntries) {
      if (e.distance >= 1) {
        const p = calcMinPerKm(e);
        if (p > 0 && p < bestPace) {
          bestPace = p;
          bestPaceEntry = e;
        }
      }
    }

    const sessionCount = allEntries.length;
    const activityCount = new Set(allEntries.map((e) => e.exercise)).size;

    // Per-activity stats
    const perActivity: Record<string, { totalDist: number; totalDur: number; bestPace: number; entries: CardioEntry[] }> = {};
    for (const ex of CARDIO_EXERCISES) {
      const exEntries = allEntries.filter((e) => e.exercise === ex.id);
      if (exEntries.length > 0) {
        let bp = Infinity;
        for (const e of exEntries) {
          if (e.distance >= 1) {
            const p = calcMinPerKm(e);
            if (p > 0 && p < bp) bp = p;
          }
        }
        perActivity[ex.id] = {
          totalDist: exEntries.reduce((s, e) => s + e.distance, 0),
          totalDur: exEntries.reduce((s, e) => s + e.duration, 0),
          bestPace: bp === Infinity ? 0 : bp,
          entries: exEntries,
        };
      }
    }

    return {
      userId, name: u.name, totalDistance, totalDuration,
      bestPace: bestPace === Infinity ? 0 : bestPace,
      bestPaceEntry, sessionCount, activityCount, perActivity,
    };
  });

  const hasData = userStats.some((u) => u.sessionCount > 0);

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
        <Trophy className="mx-auto mb-3 h-6 w-6 text-white/20" />
        <p className="text-sm text-white/30">No cardio data yet</p>
      </div>
    );
  }

  const byDistance = [...userStats].filter((u) => u.sessionCount > 0).sort((a, b) => b.totalDistance - a.totalDistance);
  const byPace = [...userStats].filter((u) => u.bestPace > 0).sort((a, b) => a.bestPace - b.bestPace);
  const bySessions = [...userStats].filter((u) => u.sessionCount > 0).sort((a, b) => b.sessionCount - a.sessionCount);

  // Collect activities with data
  const activitiesWithData = CARDIO_EXERCISES.filter((ex) =>
    userStats.some((u) => u.perActivity[ex.id])
  );

  return (
    <div className="space-y-4">
      {/* Total Distance */}
      <CategorySection
        icon={<MapPin className="h-4 w-4 text-blue-400" />}
        title="Most Distance"
        accent="bg-gradient-to-b from-blue-500/5 to-transparent"
      >
        {byDistance.map((u, i) => {
          const style = RANK_STYLES[i] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent" };
          return (
            <div key={u.userId} className={`flex items-center justify-between rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-black ${style.color}`}>{i + 1}</span>
                <span className="text-sm font-medium text-white">{u.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{u.totalDistance.toFixed(1)} km</div>
                <div className="text-[10px] text-white/25">{formatDuration(u.totalDuration)}</div>
              </div>
            </div>
          );
        })}
      </CategorySection>

      {/* Fastest Pace */}
      {byPace.length > 0 && (
        <CategorySection icon={<Zap className="h-4 w-4 text-yellow-400" />} title="Fastest Pace">
          {byPace.map((u, i) => {
            const style = RANK_STYLES[i] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent" };
            const exName = u.bestPaceEntry ? (getCardioExercise(u.bestPaceEntry.exercise)?.name ?? "") : "";
            return (
              <div key={u.userId} className={`flex items-center justify-between rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black ${style.color}`}>{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{u.name}</div>
                    <div className="text-[10px] text-white/25">{exName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{formatPace(u.bestPace)}</div>
                  <div className="text-[10px] text-white/25">best pace</div>
                </div>
              </div>
            );
          })}
        </CategorySection>
      )}

      {/* Most Sessions */}
      <CategorySection icon={<Flame className="h-4 w-4 text-orange-400" />} title="Most Sessions">
        {bySessions.map((u, i) => {
          const style = RANK_STYLES[i] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent" };
          return (
            <div key={u.userId} className={`flex items-center justify-between rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-black ${style.color}`}>{i + 1}</span>
                <span className="text-sm font-medium text-white">{u.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{u.sessionCount} sessions</div>
                <div className="text-[10px] text-white/25">{u.activityCount} activities</div>
              </div>
            </div>
          );
        })}
      </CategorySection>

      {/* Per-Activity Breakdown */}
      {activitiesWithData.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-xs font-medium text-white/30 tracking-widest uppercase px-1 pt-2">
            Activity Breakdown
          </h2>
          {activitiesWithData.map((exercise) => {
            const usersWithData = userStats.filter((u) => u.perActivity[exercise.id]);
            const ranked = [...usersWithData].sort(
              (a, b) => b.perActivity[exercise.id].totalDist - a.perActivity[exercise.id].totalDist
            );

            const isSolo = ranked.length === 1;
            const isExpanded = expandedSolo.has(exercise.id);

            if (isSolo && !isExpanded) {
              return (
                <button key={exercise.id} onClick={() => toggleSolo(exercise.id)}
                  className="flex items-center justify-between w-full rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2 text-left">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-white/20" />
                    <span className="text-[10px] font-semibold text-white/30 uppercase">{exercise.emoji} {exercise.name}</span>
                  </div>
                  <span className="text-[10px] text-white/20">{ranked[0].name} only</span>
                </button>
              );
            }

            return (
              <div key={exercise.id} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                  {isSolo && (
                    <button onClick={() => toggleSolo(exercise.id)} className="text-white/20 hover:text-white/40">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  )}
                  <span className="text-base">{exercise.emoji}</span>
                  <span className="text-sm font-bold text-white">{exercise.name}</span>
                </div>
                <div className="p-3 space-y-1.5">
                  {ranked.map((u, i) => {
                    const stats = u.perActivity[exercise.id];
                    const style = RANK_STYLES[i] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent" };
                    return (
                      <div key={u.userId} className={`rounded-xl border px-4 py-2.5 ${style.border} ${style.bg}`}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-base font-black ${style.color}`}>{i + 1}</span>
                          <span className="text-sm font-medium text-white">{u.name}</span>
                          <span className="text-[10px] text-white/20">{stats.entries.length} sessions</span>
                        </div>
                        <div className="flex gap-3 text-[11px] pl-7">
                          <span><span className="font-bold text-primary">{stats.totalDist.toFixed(1)}</span><span className="text-white/25">km</span></span>
                          <span><span className="font-bold text-white">{formatDuration(stats.totalDur)}</span></span>
                          {stats.bestPace > 0 && (
                            <span><span className="font-bold text-white">{formatPace(stats.bestPace)}</span></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
