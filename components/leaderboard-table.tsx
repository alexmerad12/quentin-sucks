"use client";

import { useApp } from "@/lib/storage";
import { USER_LIST } from "@/lib/constants";
import { calcVolume, getEffectiveWeight } from "@/lib/calculations";
import { inferCategory } from "@/lib/exercises";
import type { UserId, WorkoutEntry, ExerciseConfig } from "@/types";
import { Trophy, Crown, Dumbbell, Flame } from "lucide-react";

interface LeaderboardProps {
  month: string;
}

const RANK_STYLES = [
  { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { color: "text-gray-400", bg: "bg-white/5", border: "border-white/10" },
  { color: "text-amber-600", bg: "bg-amber-500/5", border: "border-amber-500/10" },
];

function RankCard({ rank, name, value, label }: { rank: number; name: string; value: string; label: string }) {
  const style = RANK_STYLES[rank] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent" };
  return (
    <div className={`flex items-center justify-between rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
      <div className="flex items-center gap-3">
        <span className={`text-lg font-black ${style.color}`}>{rank + 1}</span>
        <span className="text-sm font-medium text-white">{name}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-white">{value}</div>
        <div className="text-[10px] text-white/25">{label}</div>
      </div>
    </div>
  );
}

function CategorySection({ icon, title, children, accent }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden ${accent ?? ""}`}>
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        {icon}
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      <div className="p-3 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function ExerciseRankRow({ rank, name, stats }: {
  rank: number;
  name: string;
  stats: { volume: number; best: number; entries: WorkoutEntry[] };
}) {
  const style = RANK_STYLES[rank] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent" };
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${style.border} ${style.bg}`}>
      <div className="flex items-center gap-3">
        <span className={`text-lg font-black ${style.color}`}>{rank + 1}</span>
        <div>
          <div className="text-sm font-medium text-white">{name}</div>
          <div className="text-[10px] text-white/25">{stats.entries.length} entries</div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="text-right">
          <div className="font-bold text-white">{stats.volume.toLocaleString()}</div>
          <div className="text-white/25">volume</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-primary">{stats.best} lbs</div>
          <div className="text-white/25">best</div>
        </div>
      </div>
    </div>
  );
}

export function Leaderboard({ month }: LeaderboardProps) {
  const { getEntries, getBodyWeight, getAllExercises } = useApp();
  const exercises = getAllExercises();

  // Gather all stats per user
  const userStats = USER_LIST.map((u) => {
    const userId = u.id as UserId;
    const allEntries = getEntries({ userId, month });
    const bodyWeight = getBodyWeight(userId, month);

    const totalVolume = allEntries.reduce((sum, e) => sum + calcVolume(e, bodyWeight), 0);
    const heaviestLift = allEntries.length
      ? Math.max(...allEntries.map((e) => getEffectiveWeight(e, bodyWeight)))
      : 0;
    const entryCount = allEntries.length;
    const exerciseCount = new Set(allEntries.map((e) => e.exercise)).size;

    // Per-exercise volume
    const perExercise: Record<string, { volume: number; best: number; entries: WorkoutEntry[] }> = {};
    for (const ex of exercises) {
      const exEntries = allEntries.filter((e) => e.exercise === ex.id);
      if (exEntries.length > 0) {
        perExercise[ex.id] = {
          volume: exEntries.reduce((s, e) => s + calcVolume(e, bodyWeight), 0),
          best: Math.max(...exEntries.map((e) => getEffectiveWeight(e, bodyWeight))),
          entries: exEntries,
        };
      }
    }

    // Also check for entries with exercise IDs not in exercises list
    const knownIds = new Set(exercises.map((e) => e.id));
    for (const entry of allEntries) {
      if (!knownIds.has(entry.exercise) && !perExercise[entry.exercise]) {
        const exEntries = allEntries.filter((e) => e.exercise === entry.exercise);
        perExercise[entry.exercise] = {
          volume: exEntries.reduce((s, e) => s + calcVolume(e, bodyWeight), 0),
          best: Math.max(...exEntries.map((e) => getEffectiveWeight(e, bodyWeight))),
          entries: exEntries,
        };
      }
    }

    return { userId, name: u.name, totalVolume, heaviestLift, entryCount, exerciseCount, perExercise };
  });

  const hasData = userStats.some((u) => u.entryCount > 0);

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
        <Trophy className="mx-auto mb-3 h-6 w-6 text-white/20" />
        <p className="text-sm text-white/30">No data this month</p>
      </div>
    );
  }

  // Sort for each category
  const byVolume = [...userStats].filter((u) => u.entryCount > 0).sort((a, b) => b.totalVolume - a.totalVolume);
  const byHeaviest = [...userStats].filter((u) => u.entryCount > 0).sort((a, b) => b.heaviestLift - a.heaviestLift);
  const byConsistency = [...userStats].filter((u) => u.entryCount > 0).sort((a, b) => b.entryCount - a.entryCount);

  // Build category → exercises map for the breakdown
  // Collect all exercise IDs that have data
  const exerciseIdsWithData = new Set<string>();
  for (const u of userStats) {
    for (const exId of Object.keys(u.perExercise)) {
      exerciseIdsWithData.add(exId);
    }
  }

  // Build exercise config lookup (for known + custom exercises)
  const exerciseMap = new Map<string, ExerciseConfig>();
  for (const ex of exercises) {
    exerciseMap.set(ex.id, ex);
  }
  // For unknown exercise IDs, create a placeholder config
  for (const exId of exerciseIdsWithData) {
    if (!exerciseMap.has(exId)) {
      exerciseMap.set(exId, {
        id: exId,
        name: exId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        usesBodyWeight: false,
        isOptional: true,
        isCustom: true,
      });
    }
  }

  const categoryOrder = ["Squat", "Deadlift", "Bench", "Shoulder Press", "Pull", "Push", "Legs", "Arms"];

  return (
    <div className="space-y-4">
      {/* Overall Champion */}
      <CategorySection
        icon={<Crown className="h-4 w-4 text-yellow-400" />}
        title="Overall Champion"
        accent="bg-gradient-to-b from-yellow-500/5 to-transparent"
      >
        {byVolume.map((u, i) => (
          <RankCard
            key={u.userId}
            rank={i}
            name={u.name}
            value={u.totalVolume.toLocaleString() + " lbs"}
            label="total volume"
          />
        ))}
      </CategorySection>

      {/* Heaviest Lifter */}
      <CategorySection
        icon={<Dumbbell className="h-4 w-4 text-red-400" />}
        title="Heaviest Single Lift"
      >
        {byHeaviest.map((u, i) => (
          <RankCard
            key={u.userId}
            rank={i}
            name={u.name}
            value={u.heaviestLift + " lbs"}
            label="heaviest weight"
          />
        ))}
      </CategorySection>

      {/* Most Consistent */}
      <CategorySection
        icon={<Flame className="h-4 w-4 text-orange-400" />}
        title="Most Consistent"
      >
        {byConsistency.map((u, i) => (
          <RankCard
            key={u.userId}
            rank={i}
            name={u.name}
            value={u.entryCount + " entries"}
            label={u.exerciseCount + " exercises"}
          />
        ))}
      </CategorySection>

      {/* Exercise Breakdown — each exercise gets its own card */}
      {(() => {
        // Flatten all exercises with data into a single list, sorted by category then name
        const allExercisesWithData = [...exerciseIdsWithData]
          .map((exId) => exerciseMap.get(exId)!)
          .sort((a, b) => {
            const catA = inferCategory(a);
            const catB = inferCategory(b);
            const orderA = categoryOrder.indexOf(catA);
            const orderB = categoryOrder.indexOf(catB);
            const sortA = orderA === -1 ? 999 : orderA;
            const sortB = orderB === -1 ? 999 : orderB;
            if (sortA !== sortB) return sortA - sortB;
            return a.name.localeCompare(b.name);
          });

        if (allExercisesWithData.length === 0) return null;

        return (
          <div className="space-y-1.5">
            <h2 className="text-xs font-medium text-white/30 tracking-widest uppercase px-1 pt-2">
              Exercise Breakdown
            </h2>

            {allExercisesWithData.map((exercise) => {
              const category = inferCategory(exercise);
              const ranked = userStats
                .filter((u) => u.perExercise[exercise.id])
                .sort((a, b) => (b.perExercise[exercise.id]?.volume ?? 0) - (a.perExercise[exercise.id]?.volume ?? 0));

              if (ranked.length === 0) return null;

              return (
                <div key={exercise.id} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{(exercise as any).emoji || "🏋️"}</span>
                      <span className="text-sm font-bold text-white">{exercise.name}</span>
                    </div>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] text-white/25 uppercase tracking-wider">
                      {category}
                    </span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {ranked.map((u, i) => (
                      <ExerciseRankRow
                        key={u.userId}
                        rank={i}
                        name={u.name}
                        stats={u.perExercise[exercise.id]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
