"use client";

import { useApp } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { AddExerciseDialog } from "./add-exercise-dialog";
import { Check } from "lucide-react";

interface ExerciseGridProps {
  selected: string | null;
  onSelect: (id: string) => void;
  completedExercises?: Set<string>;
}

const EXERCISE_ICONS: Record<string, string> = {
  squat: "🦵",
  deadlift: "🏋️",
  bench: "💪",
  ohp: "🙌",
  pullups: "🔝",
  dips: "⬇️",
  "leg-press": "🦿",
};

export function ExerciseGrid({ selected, onSelect, completedExercises }: ExerciseGridProps) {
  const { getAllExercises } = useApp();
  const exercises = getAllExercises();

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-white/30 tracking-widest uppercase px-1">
        Exercises
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {exercises.map((ex) => {
          const done = completedExercises?.has(ex.id);
          const isSelected = selected === ex.id;
          const icon = EXERCISE_ICONS[ex.id] ?? "🔥";

          return (
            <button
              key={ex.id}
              onClick={() => onSelect(ex.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all duration-200 active:scale-[0.97]",
                isSelected
                  ? "border-primary/40 bg-primary/10 shadow-[0_0_20px_rgba(74,222,128,0.1)]"
                  : done
                  ? "border-primary/20 bg-primary/[0.03]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
              )}
            >
              <span className="text-xl">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm font-semibold truncate",
                  isSelected ? "text-primary" : done ? "text-primary/70" : "text-white"
                )}>
                  {ex.name}
                </div>
                {ex.isCustom && (
                  <div className="text-[10px] text-white/20">custom</div>
                )}
              </div>
              {done && !isSelected && (
                <Check className="h-4 w-4 text-primary/60 shrink-0" />
              )}
            </button>
          );
        })}
        <AddExerciseDialog />
      </div>
    </div>
  );
}
