"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const EMOJI_OPTIONS = [
  // Upper body
  "💪", "🏋️", "🙌", "🤜", "👊", "🫸",
  // Lower body
  "🦵", "🦿", "🏃", "🚶",
  // Full body / cardio
  "🔥", "⚡", "💥", "🤸", "🧘", "🏊", "🚴", "⛹️",
  // Specific exercises
  "🔝", "⬇️", "↕️", "🔄", "🎯", "🪢",
  // Equipment
  "🥊", "🧗", "🤾", "🏆", "💎", "🫁", "⏱️", "🎽",
];

export function AddExerciseDialog() {
  const { addCustomExercise, getAllExercises } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [usesBodyWeight, setUsesBodyWeight] = useState(false);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const id = trimmed.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = getAllExercises();
    if (existing.some((e) => e.id === id)) {
      toast.error("Exercise already exists");
      return;
    }

    addCustomExercise({
      id,
      name: trimmed,
      emoji,
      usesBodyWeight,
      isOptional: true,
      isCustom: true,
    });

    toast.success(`Added ${emoji} ${trimmed}!`);
    setName("");
    setEmoji("🔥");
    setUsesBodyWeight(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.02] active:scale-[0.97]"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/30">
          <Plus className="h-4 w-4" />
        </div>
        <span className="text-sm text-white/30">Add exercise</span>
      </DialogTrigger>
      <DialogContent className="max-w-[340px] bg-[#111] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Add Exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <input
            placeholder="Exercise name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/40"
            autoFocus
          />

          {/* Emoji picker */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
              Pick an icon
            </span>
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all active:scale-90 ${
                    emoji === e
                      ? "bg-primary/20 ring-1 ring-primary/40 scale-110"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-white/60">
            <input
              type="checkbox"
              checked={usesBodyWeight}
              onChange={(e) => setUsesBodyWeight(e.target.checked)}
              className="rounded accent-primary"
            />
            Uses body weight (pull-ups, dips, etc.)
          </label>
          <button
            onClick={handleAdd}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Add {emoji} Exercise
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
