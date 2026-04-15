"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { getCurrentMonth } from "@/lib/calculations";
import { USER_LIST } from "@/lib/constants";
import { CARDIO_EXERCISES } from "@/lib/cardio-exercises";
import { MonthPicker } from "@/components/month-picker";
import { WeeklyTable } from "@/components/weekly-table";
import { CardioHistoryTable } from "@/components/cardio-history-table";
import { UserSelector } from "@/components/user-selector";
import type { UserId } from "@/types";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const { activeUser, getAllExercises, getCardioEntries } = useApp();
  const [month, setMonth] = useState(getCurrentMonth);
  const [viewUser, setViewUser] = useState<UserId | null>(null);
  const [mode, setMode] = useState<"lifting" | "cardio">("lifting");

  if (!activeUser) return <UserSelector />;

  const exercises = getAllExercises();
  const displayUser = viewUser ?? activeUser.id;

  // Find which cardio exercises have data for this user/month
  const cardioWithData = CARDIO_EXERCISES.filter((ex) => {
    const entries = getCardioEntries({ userId: displayUser, exercise: ex.id, month });
    return entries.length > 0;
  });

  return (
    <div className="space-y-5 px-4 pt-4">
      <h1 className="text-2xl font-bold text-white">History</h1>

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

      <div className="flex items-center justify-center gap-1.5">
        {USER_LIST.map((u) => {
          const active = displayUser === u.id;
          return (
            <button
              key={u.id}
              onClick={() => setViewUser(u.id as UserId)}
              className={cn(
                "h-9 rounded-lg px-4 text-xs font-semibold transition-all duration-200",
                active
                  ? "bg-primary text-black shadow-[0_0_12px_rgba(74,222,128,0.2)]"
                  : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
              )}
            >
              {u.name}
            </button>
          );
        })}
      </div>

      {mode === "lifting" ? (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <WeeklyTable key={ex.id} exerciseId={ex.id} userId={displayUser} month={month} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {cardioWithData.length > 0 ? (
            cardioWithData.map((ex) => (
              <CardioHistoryTable key={ex.id} exerciseId={ex.id} userId={displayUser} month={month} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-sm text-white/30">No cardio sessions this month</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
