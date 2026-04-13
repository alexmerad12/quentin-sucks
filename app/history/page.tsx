"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { getCurrentMonth } from "@/lib/calculations";
import { USER_LIST } from "@/lib/constants";
import { MonthPicker } from "@/components/month-picker";
import { WeeklyTable } from "@/components/weekly-table";
import { UserSelector } from "@/components/user-selector";
import type { UserId } from "@/types";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const { activeUser, getAllExercises } = useApp();
  const [month, setMonth] = useState(getCurrentMonth);
  const [viewUser, setViewUser] = useState<UserId | null>(null);

  if (!activeUser) return <UserSelector />;

  const exercises = getAllExercises();
  const displayUser = viewUser ?? activeUser.id;

  return (
    <div className="space-y-5 px-4 pt-4">
      <h1 className="text-2xl font-bold text-white">History</h1>

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

      <div className="space-y-3">
        {exercises.map((ex) => (
          <WeeklyTable
            key={ex.id}
            exerciseId={ex.id}
            userId={displayUser}
            month={month}
          />
        ))}
      </div>
    </div>
  );
}
