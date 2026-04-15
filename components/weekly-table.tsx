"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { calcVolume, getEffectiveWeight } from "@/lib/calculations";
import type { UserId, WorkoutEntry } from "@/types";
import { Trash2, Pencil, Check, X } from "lucide-react";

interface WeeklyTableProps {
  exerciseId: string;
  userId: UserId;
  month: string;
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

  const handleSave = () => {
    onUpdate({ reps, sets, weight, notes, maxReps: Math.max(reps, entry.maxReps) });
    setEditing(false);
  };

  const handleCancel = () => {
    setReps(entry.reps);
    setSets(entry.sets);
    setWeight(entry.weight);
    setNotes(entry.notes);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg bg-white/[0.04] border border-primary/20 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary">WK {entry.week} — Editing</span>
          <div className="flex items-center gap-1.5">
            <button onClick={handleCancel} className="flex h-6 items-center gap-1 rounded-md bg-white/5 px-2 text-[10px] text-white/40 hover:bg-white/10">
              <X className="h-3 w-3" /> Cancel
            </button>
            <button onClick={handleSave} className="flex h-6 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-bold text-black hover:brightness-110">
              <Check className="h-3 w-3" /> Save
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-white/30 uppercase">Reps</label>
            <input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-white outline-none focus:border-primary/40" />
          </div>
          <div>
            <label className="text-[9px] text-white/30 uppercase">Sets</label>
            <input type="number" value={sets} onChange={(e) => setSets(Number(e.target.value))}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-white outline-none focus:border-primary/40" />
          </div>
          <div>
            <label className="text-[9px] text-white/30 uppercase">Weight</label>
            <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-white outline-none focus:border-primary/40" />
          </div>
        </div>
        <div>
          <label className="text-[9px] text-white/30 uppercase">Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes"
            className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-white placeholder:text-white/15 outline-none focus:border-primary/40" />
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
            onClick={() => setEditing(true)}
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
