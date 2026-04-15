"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { calcVolume, calcMaxRepsVol, getEffectiveWeight, getWeeksInMonth } from "@/lib/calculations";
import type { UserId, WorkoutEntry } from "@/types";
import { Trash2, Pencil, Check, X, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

interface WeeklyTableProps {
  exerciseId: string;
  userId: UserId;
  month: string;
}

function MiniStepper({ value, onChange, step = 1, min = 0 }: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/5 text-white/50 active:scale-95"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-7 w-12 rounded border border-white/10 bg-white/[0.03] text-center text-sm font-bold text-white outline-none focus:border-primary/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        onClick={() => onChange(value + step)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/5 text-white/50 active:scale-95"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function EntryCard({ entry, bodyWeight, usesBodyWeight, onDelete, onUpdate }: {
  entry: WorkoutEntry;
  bodyWeight: number;
  usesBodyWeight: boolean;
  onDelete: () => void;
  onUpdate: (updates: Partial<WorkoutEntry>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState(entry.reps);
  const [sets, setSets] = useState(entry.sets);
  const [weight, setWeight] = useState(entry.weight);
  const [notes, setNotes] = useState(entry.notes);

  const effectiveWt = getEffectiveWeight(entry, bodyWeight);
  const volume = calcVolume(entry, bodyWeight);

  const startEdit = () => {
    setReps(entry.reps);
    setSets(entry.sets);
    setWeight(entry.weight);
    setNotes(entry.notes);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    onUpdate({ reps, sets, weight, notes });
    setEditing(false);
    toast.success("Entry updated!");
  };

  if (editing) {
    return (
      <div className="rounded-lg bg-white/[0.06] border border-primary/20 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary">WK {entry.week} — Editing</span>
          <span className="text-[10px] text-white/30">{entry.date}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Reps</span>
            <MiniStepper value={reps} onChange={setReps} min={1} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Sets</span>
            <MiniStepper value={sets} onChange={setSets} min={1} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">{usesBodyWeight ? "+lbs" : "Weight"}</span>
            <MiniStepper value={weight} onChange={setWeight} step={5} />
          </div>
        </div>

        <input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/40"
        />

        <div className="flex gap-2">
          <button
            onClick={saveEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-xs font-bold text-black transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Check className="h-3 w-3" />
            Save
          </button>
          <button
            onClick={cancelEdit}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/5 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary">WK {entry.week}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30">{entry.date}</span>
          <button
            onClick={startEdit}
            className="flex h-5 w-5 items-center justify-center rounded text-white/15 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="flex h-5 w-5 items-center justify-center rounded text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="text-base font-bold text-white">
        {entry.reps} reps × {entry.sets} sets × {usesBodyWeight ? effectiveWt : entry.weight} lbs
      </div>
      <div className="text-xs text-white/40">
        Volume: {volume.toLocaleString()} lbs
      </div>
      {entry.notes && !entry.notes.startsWith("AI:") && (
        <div className="text-xs text-white/25 italic">{entry.notes}</div>
      )}
    </div>
  );
}

export function WeeklyTable({ exerciseId, userId, month }: WeeklyTableProps) {
  const { getEntries, getBodyWeight, getAllExercises, deleteEntry, updateEntry } = useApp();
  const allExercises = getAllExercises();
  const exercise = allExercises.find((e) => e.id === exerciseId);
  const bodyWeight = getBodyWeight(userId, month);

  const entries = getEntries({ userId, exercise: exerciseId, month });
  const sorted = [...entries].sort((a, b) => a.week - b.week);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm font-bold text-white">{exercise?.name}</span>
        <div className="flex items-center gap-2">
          {exercise?.isOptional && (
            <span className="text-[10px] text-white/20">optional</span>
          )}
          {sorted.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {sorted.length} entries
            </span>
          )}
        </div>
      </div>
      {sorted.length > 0 ? (
        <div className="p-3 space-y-2">
          {sorted.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              bodyWeight={bodyWeight}
              usesBodyWeight={exercise?.usesBodyWeight ?? false}
              onDelete={() => { if (confirm("Delete this entry?")) deleteEntry(entry.id); }}
              onUpdate={(updates) => updateEntry(entry.id, updates)}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-xs text-white/15">
          No entries this month
        </div>
      )}
    </div>
  );
}
