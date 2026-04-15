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

  if (!activeUser) return <UserSelector />;

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

      <MonthPicker month={month} onChange={setMonth} />

      {mode === "lifting" ? (
        <Leaderboard month={month} />
      ) : (
        <CardioLeaderboard month={month} />
      )}
    </div>
  );
}
