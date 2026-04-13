"use client";

import { useApp } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { AddExerciseDialog } from "./add-exercise-dialog";
import { Check, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

interface ExerciseGridProps {
  selected: string;
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
  const { getAllExercises, removeCustomExercise } = useApp();
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
              onClick={() => onSelect(isSelected ? "" : ex.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all duration-150 active:scale-[0.97]",
                isSelected
                  ? "border-primary bg-primary/15 ring-1 ring-primary/30 shadow-[0_0_24px_rgba(74,222,128,0.15)]"
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
              {isSelected ? (
                <ChevronRight className="h-4 w-4 text-primary shrink-0" />
              ) : done ? (
                <Check className="h-4 w-4 text-primary/60 shrink-0" />
              ) : null}
              {/* Delete button for custom exercises */}
              {ex.isCustom && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomExercise(ex.id);
                    if (isSelected) onSelect("");
                    toast.success(`Removed ${ex.name}`);
                  }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
        <AddExerciseDialog />
      </div>
    </div>
  );
}
