"use client";

import { useApp } from "@/lib/storage";
import { USER_LIST } from "@/lib/constants";
import { calcVolume, getEffectiveWeight } from "@/lib/calculations";
import { inferCategory } from "@/lib/exercises";
import type { UserId, WorkoutEntry, ExerciseConfig } from "@/types";
import { Trophy, Crown, Dumbbell, Flame, Scale } from "lucide-react";

interface LeaderboardProps {
  month: string;
}

const RANK_STYLES = [
  { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { color: "text-gray-400", bg: "bg-white/5", border: "border-white/10" },
  { color: "text-amber-600", bg: "bg-amber-500/5", border: "border-amber-500/10" },
];

// Dumbbell exercises are harder due to stabilization — each arm works independently.
// Weight entered is per arm, so effective = weight × 2, then × 1.15 difficulty bonus.
// This makes 45 lb/arm dumbbell (= 90 lb total × 1.15 = ~103 adjusted) comparable to barbell.
const DUMBBELL_MULTIPLIER = 2 * 1.15; // per-arm → total + 15% difficulty bonus

function isDumbbellExercise(ex: ExerciseConfig): boolean {
  const lower = ex.name.toLowerCase();
  return lower.includes("dumbbell") || lower.includes("db ");
}

function getAdjustedWeight(weight: number, ex: ExerciseConfig): number {
  if (isDumbbellExercise(ex)) {
    return Math.round(weight * DUMBBELL_MULTIPLIER);
  }
  return weight;
}

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

    // Per-exercise stats
    const perExercise: Record<string, { volume: number; best: number; totalReps: number; entries: WorkoutEntry[] }> = {};
    const knownIds = new Set(exercises.map((e) => e.id));

    function buildExStats(exEntries: WorkoutEntry[]) {
      return {
        volume: exEntries.reduce((s, e) => s + calcVolume(e, bodyWeight), 0),
        best: Math.max(...exEntries.map((e) => getEffectiveWeight(e, bodyWeight))),
        totalReps: exEntries.reduce((s, e) => s + e.reps * e.sets, 0),
        entries: exEntries,
      };
    }

    for (const ex of exercises) {
      const exEntries = allEntries.filter((e) => e.exercise === ex.id);
      if (exEntries.length > 0) {
        perExercise[ex.id] = buildExStats(exEntries);
      }
    }
    for (const entry of allEntries) {
      if (!knownIds.has(entry.exercise) && !perExercise[entry.exercise]) {
        const exEntries = allEntries.filter((e) => e.exercise === entry.exercise);
        perExercise[entry.exercise] = buildExStats(exEntries);
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

  const byVolume = [...userStats].filter((u) => u.entryCount > 0).sort((a, b) => b.totalVolume - a.totalVolume);
  const byHeaviest = [...userStats].filter((u) => u.entryCount > 0).sort((a, b) => b.heaviestLift - a.heaviestLift);
  const byConsistency = [...userStats].filter((u) => u.entryCount > 0).sort((a, b) => b.entryCount - a.entryCount);

  // Collect exercise IDs with data and build config map
  const exerciseIdsWithData = new Set<string>();
  for (const u of userStats) {
    for (const exId of Object.keys(u.perExercise)) {
      exerciseIdsWithData.add(exId);
    }
  }

  const exerciseMap = new Map<string, ExerciseConfig>();
  for (const ex of exercises) exerciseMap.set(ex.id, ex);
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

  // Group exercises by category
  const categoryGroups = new Map<string, ExerciseConfig[]>();
  for (const exId of exerciseIdsWithData) {
    const ex = exerciseMap.get(exId)!;
    const cat = inferCategory(ex);
    if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
    categoryGroups.get(cat)!.push(ex);
  }

  const categoryOrder = ["Squat", "Deadlift", "Bench", "Shoulder Press", "Pull", "Push", "Legs", "Arms"];
  const sortedCategories = [...categoryGroups.entries()].sort((a, b) => {
    const ai = categoryOrder.indexOf(a[0]);
    const bi = categoryOrder.indexOf(b[0]);
    const sa = ai === -1 ? 999 : ai;
    const sb = bi === -1 ? 999 : bi;
    return sa - sb;
  });

  return (
    <div className="space-y-4">
      {/* Overall Champion */}
      <CategorySection
        icon={<Crown className="h-4 w-4 text-yellow-400" />}
        title="Overall Champion"
        accent="bg-gradient-to-b from-yellow-500/5 to-transparent"
      >
        {byVolume.map((u, i) => (
          <RankCard key={u.userId} rank={i} name={u.name} value={u.totalVolume.toLocaleString() + " lbs"} label="total volume" />
        ))}
      </CategorySection>

      {/* Heaviest Lifter */}
      <CategorySection icon={<Dumbbell className="h-4 w-4 text-red-400" />} title="Heaviest Single Lift">
        {byHeaviest.map((u, i) => (
          <RankCard key={u.userId} rank={i} name={u.name} value={u.heaviestLift + " lbs"} label="heaviest weight" />
        ))}
      </CategorySection>

      {/* Most Consistent */}
      <CategorySection icon={<Flame className="h-4 w-4 text-orange-400" />} title="Most Consistent">
        {byConsistency.map((u, i) => (
          <RankCard key={u.userId} rank={i} name={u.name} value={u.entryCount + " entries"} label={u.exerciseCount + " exercises"} />
        ))}
      </CategorySection>

      {/* Exercise Breakdown — grouped by category */}
      {sortedCategories.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-white/30 tracking-widest uppercase px-1 pt-2">
            Exercise Breakdown
          </h2>

          {sortedCategories.map(([category, categoryExercises]) => {
            const sorted = [...categoryExercises].sort((a, b) => a.name.localeCompare(b.name));
            const hasDumbbellVariant = sorted.some(isDumbbellExercise);

            // Check if entire category is bodyweight-only
            const isCategoryBodyweight = sorted.every((ex) => {
              const usersWithEx = userStats.filter((u) => u.perExercise[ex.id]);
              return usersWithEx.length === 0 || usersWithEx.every(
                (u) => u.perExercise[ex.id].entries.every((e) => e.weight === 0)
              );
            });

            // Combined category ranking
            const combinedRanking = userStats
              .map((u) => {
                let bestAdjusted = 0;
                let bestRaw = 0;
                let bestExName = "";
                let totalAdjustedVolume = 0;
                let totalCategoryReps = 0;

                for (const ex of sorted) {
                  const stats = u.perExercise[ex.id];
                  if (!stats) continue;
                  totalCategoryReps += stats.totalReps;
                  const adjusted = getAdjustedWeight(stats.best, ex);
                  totalAdjustedVolume += stats.entries.reduce((sum, entry) => {
                    const rawVol = entry.reps * entry.sets * entry.weight;
                    return sum + (isDumbbellExercise(ex) ? Math.round(rawVol * DUMBBELL_MULTIPLIER) : rawVol);
                  }, 0);
                  if (adjusted > bestAdjusted) {
                    bestAdjusted = adjusted;
                    bestRaw = stats.best;
                    bestExName = ex.name;
                  }
                }

                return { ...u, bestAdjusted, bestRaw, bestExName, totalAdjustedVolume, totalCategoryReps };
              })
              .filter((u) => isCategoryBodyweight ? u.totalCategoryReps > 0 : u.bestAdjusted > 0)
              .sort((a, b) => isCategoryBodyweight
                ? b.totalCategoryReps - a.totalCategoryReps
                : b.bestAdjusted - a.bestAdjusted);

            if (combinedRanking.length === 0) return null;

            return (
              <div key={category} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                {/* Category header */}
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                  <span className="text-base">🏋️</span>
                  <span className="text-sm font-bold text-white">{category}</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/30">
                    {sorted.length} {sorted.length === 1 ? "exercise" : "variants"}
                  </span>
                </div>

                <div className="p-3 space-y-3">
                  {/* Combined ranking */}
                  {sorted.length > 1 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-1 mb-1.5">
                        <Scale className="h-3 w-3 text-primary/50" />
                        <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider">
                          Combined Ranking
                        </span>
                        {hasDumbbellVariant && !isCategoryBodyweight && (
                          <span className="text-[9px] text-white/20 ml-1">
                            (DB: per arm ×2 + 15% difficulty)
                          </span>
                        )}
                        {isCategoryBodyweight && (
                          <span className="text-[9px] text-white/20 ml-1">
                            (ranked by reps)
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {combinedRanking.map((u, i) => {
                          const style = RANK_STYLES[i] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent" };
                          return (
                            <div key={u.userId} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${style.border} ${style.bg}`}>
                              <div className="flex items-center gap-3">
                                <span className={`text-lg font-black ${style.color}`}>{i + 1}</span>
                                <div>
                                  <div className="text-sm font-medium text-white">{u.name}</div>
                                  {!isCategoryBodyweight && (
                                    <div className="text-[10px] text-white/25">via {u.bestExName}</div>
                                  )}
                                </div>
                              </div>
                              {isCategoryBodyweight ? (
                              <div className="flex items-center gap-4 text-xs">
                                <div className="text-right">
                                  <div className="font-bold text-white">{u.totalCategoryReps.toLocaleString()}</div>
                                  <div className="text-white/25">total reps</div>
                                </div>
                              </div>
                              ) : (
                              <div className="flex items-center gap-4 text-xs">
                                <div className="text-right">
                                  <div className="font-bold text-white">{u.totalAdjustedVolume.toLocaleString()}</div>
                                  <div className="text-white/25">adj. vol</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-primary">{u.bestAdjusted} lbs</div>
                                  <div className="text-white/25">adj. best</div>
                                </div>
                              </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Per-exercise breakdown */}
                  {sorted.map((exercise) => {
                    const usersWithData = userStats.filter((u) => u.perExercise[exercise.id]);
                    if (usersWithData.length === 0) return null;

                    // Detect if this is a pure bodyweight exercise (no one logged weight)
                    const isBodyweightOnly = usersWithData.every(
                      (u) => u.perExercise[exercise.id].best === 0 ||
                        (exercise.usesBodyWeight && u.perExercise[exercise.id].entries.every((e) => e.weight === 0))
                    );

                    const ranked = isBodyweightOnly
                      ? [...usersWithData].sort((a, b) => (b.perExercise[exercise.id]?.totalReps ?? 0) - (a.perExercise[exercise.id]?.totalReps ?? 0))
                      : [...usersWithData].sort((a, b) => (b.perExercise[exercise.id]?.volume ?? 0) - (a.perExercise[exercise.id]?.volume ?? 0));

                    const db = isDumbbellExercise(exercise);

                    return (
                      <div key={exercise.id}>
                        <div className="flex items-center gap-2 px-1 mb-1.5">
                          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                            {exercise.name}
                          </span>
                          {db && (
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-400">DB</span>
                          )}
                          {isBodyweightOnly && (
                            <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-400">BW</span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {ranked.map((u, i) => {
                            const stats = u.perExercise[exercise.id];
                            const style = RANK_STYLES[i] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent" };
                            return (
                              <div key={u.userId} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${style.border} ${style.bg}`}>
                                <div className="flex items-center gap-3">
                                  <span className={`text-base font-black ${style.color}`}>{i + 1}</span>
                                  <div>
                                    <div className="text-sm font-medium text-white">{u.name}</div>
                                    <div className="text-[10px] text-white/25">{stats.entries.length} entries</div>
                                  </div>
                                </div>
                                {isBodyweightOnly ? (
                                  <div className="flex items-center gap-3 text-xs">
                                    <div className="text-right">
                                      <div className="font-bold text-white">{stats.totalReps.toLocaleString()}</div>
                                      <div className="text-white/25">total reps</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-primary">
                                        {Math.max(...stats.entries.map((e) => e.reps))}
                                      </div>
                                      <div className="text-white/25">best set</div>
                                    </div>
                                  </div>
                                ) : (
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="text-right">
                                    <div className="font-bold text-white">{stats.volume.toLocaleString()}</div>
                                    <div className="text-white/25">volume</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-primary">{stats.best} lbs</div>
                                    <div className="text-white/25">{db ? "per arm" : "best"}</div>
                                  </div>
                                  {db && (
                                    <div className="text-right">
                                      <div className="font-bold text-blue-400">{getAdjustedWeight(stats.best, exercise)}</div>
                                      <div className="text-white/25">adjusted</div>
                                    </div>
                                  )}
                                </div>
                                )}
                              </div>
                            );
                          })}
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
