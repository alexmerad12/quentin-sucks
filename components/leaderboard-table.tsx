"use client";

import { useApp } from "@/lib/storage";
import { USER_LIST } from "@/lib/constants";
import { calcVolume, getEffectiveWeight } from "@/lib/calculations";
import type { UserId } from "@/types";
import { Trophy, Medal, Crown } from "lucide-react";

interface LeaderboardTableProps {
  month: string;
}

interface UserStat {
  userId: UserId;
  name: string;
  totalVolume: number;
  bestWeight: number;
  entryCount: number;
}

const RANK_STYLES = [
  { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Crown },
  { color: "text-gray-400", bg: "bg-white/5", border: "border-white/10", icon: Medal },
  { color: "text-amber-600", bg: "bg-amber-500/5", border: "border-amber-500/10", icon: Medal },
];

export function LeaderboardTable({ month }: LeaderboardTableProps) {
  const { getEntries, getBodyWeight, getAllExercises } = useApp();
  const exercises = getAllExercises();

  return (
    <div className="space-y-3">
      {exercises.map((exercise) => {
        const stats: UserStat[] = USER_LIST.map((u) => {
          const entries = getEntries({
            userId: u.id as UserId,
            exercise: exercise.id,
            month,
          });
          const bodyWeight = getBodyWeight(u.id as UserId, month);
          const totalVolume = entries.reduce(
            (sum, e) => sum + calcVolume(e, bodyWeight),
            0
          );
          const bestWeight = entries.length
            ? Math.max(...entries.map((e) => getEffectiveWeight(e, bodyWeight)))
            : 0;

          return {
            userId: u.id as UserId,
            name: u.name,
            totalVolume,
            bestWeight,
            entryCount: entries.length,
          };
        })
          .filter((s) => s.entryCount > 0)
          .sort((a, b) => b.totalVolume - a.totalVolume);

        if (stats.length === 0) return null;

        return (
          <div key={exercise.id} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="border-b border-white/5 px-4 py-2.5">
              <span className="text-sm font-semibold text-white">{exercise.name}</span>
            </div>
            <div className="p-2 space-y-1.5">
              {stats.map((stat, i) => {
                const style = RANK_STYLES[i] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent", icon: Medal };
                return (
                  <div
                    key={stat.userId}
                    className={`flex items-center justify-between rounded-lg border ${style.border} ${style.bg} px-4 py-3`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-black ${style.color}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-white">{stat.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="font-bold text-white">{stat.totalVolume.toLocaleString()}</div>
                        <div className="text-white/25">volume</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{stat.bestWeight}</div>
                        <div className="text-white/25">best</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OverallLeaderboard({ month }: { month: string }) {
  const { getEntries, getBodyWeight } = useApp();

  const overallStats = USER_LIST.map((u) => {
    const entries = getEntries({ userId: u.id as UserId, month });
    const bodyWeight = getBodyWeight(u.id as UserId, month);
    const totalVolume = entries.reduce(
      (sum, e) => sum + calcVolume(e, bodyWeight),
      0
    );
    const exerciseCount = new Set(entries.map((e) => e.exercise)).size;

    return {
      userId: u.id as UserId,
      name: u.name,
      totalVolume,
      entryCount: entries.length,
      exerciseCount,
    };
  })
    .filter((s) => s.entryCount > 0)
    .sort((a, b) => b.totalVolume - a.totalVolume);

  if (overallStats.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
        <Trophy className="mx-auto mb-3 h-6 w-6 text-white/20" />
        <p className="text-sm text-white/30">No data this month</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-yellow-500/5 to-transparent overflow-hidden">
      <div className="border-b border-white/5 px-4 py-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-bold text-white">Overall Rankings</span>
      </div>
      <div className="p-3 space-y-2">
        {overallStats.map((stat, i) => {
          const style = RANK_STYLES[i] ?? { color: "text-white/30", bg: "bg-white/[0.02]", border: "border-transparent", icon: Medal };
          return (
            <div
              key={stat.userId}
              className={`flex items-center justify-between rounded-xl border ${style.border} ${style.bg} px-5 py-4`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-black ${style.color}`}>
                  {i + 1}
                </span>
                <div>
                  <div className="text-base font-bold text-white">{stat.name}</div>
                  <div className="text-[10px] text-white/25">
                    {stat.exerciseCount} exercises · {stat.entryCount} entries
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white">{stat.totalVolume.toLocaleString()}</div>
                <div className="text-[10px] text-white/25 uppercase tracking-wider">total lbs</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
