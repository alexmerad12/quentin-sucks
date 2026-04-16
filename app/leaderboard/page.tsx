"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { getCurrentMonth } from "@/lib/calculations";
import { MonthPicker } from "@/components/month-picker";
import { Leaderboard } from "@/components/leaderboard-table";
import { CardioLeaderboard } from "@/components/cardio-leaderboard";
import { UserSelector } from "@/components/user-selector";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const { activeUser } = useApp();
  const [month, setMonth] = useState(getCurrentMonth);
  const [mode, setMode] = useState<"lifting" | "cardio">("lifting");
  const [timeRange, setTimeRange] = useState<"month" | "all">("month");

  if (!activeUser) return <UserSelector />;

  // Pass empty month to indicate "all time" — the leaderboard components will handle it
  const effectiveMonth = timeRange === "all" ? "" : month;

  return (
    <div className="space-y-5 px-4 pt-4">
      <h1 className="text-2xl font-bold text-white">Leaderboard</h1>

      {/* Lifting / Cardio toggle */}
      <div className="flex rounded-xl bg-white/[0.03] border border-white/5 p-1">
        <button
          onClick={() => setMode("lifting")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all",
            mode === "lifting"
              ? "bg-primary text-black shadow-[0_0_12px_rgba(74,222,128,0.15)]"
              : "text-white/40 hover:text-white/60"
          )}
        >
          Lifting
        </button>
        <button
          onClick={() => setMode("cardio")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all",
            mode === "cardio"
              ? "bg-primary text-black shadow-[0_0_12px_rgba(74,222,128,0.15)]"
              : "text-white/40 hover:text-white/60"
          )}
        >
          Cardio
        </button>
      </div>

      {/* Month / All Time toggle */}
      <div className="flex rounded-xl bg-white/[0.03] border border-white/5 p-1">
        <button
          onClick={() => setTimeRange("month")}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all",
            timeRange === "month"
              ? "bg-white/10 text-white"
              : "text-white/30 hover:text-white/50"
          )}
        >
          Month
        </button>
        <button
          onClick={() => setTimeRange("all")}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all",
            timeRange === "all"
              ? "bg-white/10 text-white"
              : "text-white/30 hover:text-white/50"
          )}
        >
          All Time
        </button>
      </div>

      {timeRange === "month" && <MonthPicker month={month} onChange={setMonth} />}

      {mode === "lifting" ? (
        <Leaderboard month={effectiveMonth} />
      ) : (
        <CardioLeaderboard month={effectiveMonth} />
      )}
    </div>
  );
}
