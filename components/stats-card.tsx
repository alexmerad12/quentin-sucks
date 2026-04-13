"use client";

import { useApp } from "@/lib/storage";
import { getCurrentMonth, getCurrentWeek, calcVolume } from "@/lib/calculations";
import { Flame, TrendingUp, Zap } from "lucide-react";

export function StatsCard() {
  const { activeUser, getEntries, getBodyWeight } = useApp();
  if (!activeUser) return null;

  const month = getCurrentMonth();
  const week = getCurrentWeek();
  const bodyWeight = getBodyWeight(activeUser.id, month);

  const monthEntries = getEntries({ userId: activeUser.id, month });
  const weekEntries = monthEntries.filter((e) => e.week === week);

  const totalMonthVolume = monthEntries.reduce(
    (sum, e) => sum + calcVolume(e, bodyWeight),
    0
  );
  const exercisesThisWeek = new Set(weekEntries.map((e) => e.exercise)).size;

  const stats = [
    {
      label: "This Week",
      value: exercisesThisWeek,
      unit: "lifts",
      icon: Flame,
      color: "text-orange-400",
      glow: "shadow-[0_0_12px_rgba(251,146,60,0.15)]",
    },
    {
      label: "Volume",
      value: totalMonthVolume >= 1000 ? `${(totalMonthVolume / 1000).toFixed(1)}k` : totalMonthVolume,
      unit: "lbs",
      icon: TrendingUp,
      color: "text-primary",
      glow: "shadow-[0_0_12px_rgba(74,222,128,0.15)]",
    },
    {
      label: "Entries",
      value: monthEntries.length,
      unit: "total",
      icon: Zap,
      color: "text-blue-400",
      glow: "shadow-[0_0_12px_rgba(96,165,250,0.15)]",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center ${s.glow}`}
        >
          <s.icon className={`mx-auto mb-2 h-5 w-5 ${s.color}`} />
          <div className="text-xl font-bold text-white">{s.value}</div>
          <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mt-0.5">{s.unit}</div>
        </div>
      ))}
    </div>
  );
}
