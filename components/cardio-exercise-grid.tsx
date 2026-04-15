"use client";

import { CARDIO_EXERCISES } from "@/lib/cardio-exercises";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

interface CardioExerciseGridProps {
  selected: string;
  onSelect: (id: string) => void;
  completedExercises?: Set<string>;
}

export function CardioExerciseGrid({ selected, onSelect, completedExercises }: CardioExerciseGridProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-white/30 tracking-widest uppercase px-1">
        Activity
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {CARDIO_EXERCISES.map((ex) => {
          const done = completedExercises?.has(ex.id);
          const isSelected = selected === ex.id;

          return (
            <button
              key={ex.id}
              onClick={() => onSelect(isSelected ? "" : ex.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all duration-150 active:scale-[0.97]",
                isSelected
                  ? "border-primary bg-primary/15 ring-1 ring-primary/30 shadow-[0_0_24px_rgba(74,222,128,0.15)]"
                  : done
                  ? "border-primary/20 bg-primary/[0.03]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
              )}
            >
              <span className="text-xl">{ex.emoji}</span>
              <span className={cn(
                "text-[11px] font-semibold",
                isSelected ? "text-primary" : done ? "text-primary/70" : "text-white"
              )}>
                {ex.name}
              </span>
              {done && !isSelected && <Check className="h-3 w-3 text-primary/60" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
