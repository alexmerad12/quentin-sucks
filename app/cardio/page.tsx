"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { getCurrentMonth, getCurrentWeek, getWeeksInMonth, getWeekDateRange } from "@/lib/calculations";
import { MonthPicker } from "@/components/month-picker";
import { CardioExerciseGrid } from "@/components/cardio-exercise-grid";
import { CardioLogForm } from "@/components/cardio-log-form";
import { UserSelector } from "@/components/user-selector";
import { cn } from "@/lib/utils";

export default function CardioPage() {
  const { activeUser, getCardioEntries } = useApp();
  const [month, setMonth] = useState(getCurrentMonth);
  const [week, setWeek] = useState<number>(getCurrentWeek);
  const [selectedExercise, setSelectedExercise] = useState("");

  if (!activeUser) return <UserSelector />;

  const weeks = getWeeksInMonth(month);
  const weekEntries = getCardioEntries({ userId: activeUser.id, month, week });
  const completedExercises = new Set(weekEntries.map((e) => e.exercise));

  return (
    <div className="space-y-5 px-4 pt-4">
      <div>
        <p className="text-xs font-medium text-white/30 tracking-widest uppercase">
          {activeUser.name}
        </p>
        <h1 className="text-2xl font-bold text-white mt-0.5">Log Cardio</h1>
      </div>

      <MonthPicker month={month} onChange={(m) => { setMonth(m); setWeek(1); }} />

      <div className="flex items-center justify-center gap-1.5">
        {weeks.map((w) => (
          <button
            key={w}
            onClick={() => setWeek(w)}
            className={cn(
              "flex flex-col items-center rounded-lg px-3 py-1.5 transition-all duration-200",
              week === w
                ? "bg-primary text-black shadow-[0_0_12px_rgba(74,222,128,0.2)]"
                : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
            )}
          >
            <span className="text-xs font-semibold">WK {w}</span>
            <span className={cn("text-[9px]", week === w ? "text-black/50" : "text-white/15")}>
              {getWeekDateRange(month, w)}
            </span>
          </button>
        ))}
      </div>

      <CardioExerciseGrid
        selected={selectedExercise}
        onSelect={setSelectedExercise}
        completedExercises={completedExercises}
      />

      {selectedExercise && (
        <CardioLogForm exerciseId={selectedExercise} month={month} week={week} />
      )}
    </div>
  );
}
