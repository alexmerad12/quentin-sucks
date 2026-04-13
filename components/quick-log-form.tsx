"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/storage";
import { getExercise } from "@/lib/exercises";
import { getEffectiveWeight, detectPRs } from "@/lib/calculations";
import type { WorkoutEntry } from "@/types";
import { Minus, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface QuickLogFormProps {
  exerciseId: string;
  month: string;
  week: 1 | 2 | 3 | 4 | 5;
  onSaved?: () => void;
}

function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/50 transition-colors hover:bg-white/10 active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="h-10 w-16 rounded-lg border border-white/10 bg-white/[0.03] text-center text-lg font-bold text-white outline-none focus:border-primary/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          onClick={() => onChange(value + step)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/50 transition-colors hover:bg-white/10 active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function QuickLogForm({ exerciseId, month, week, onSaved }: QuickLogFormProps) {
  const { data, activeUser, addEntry, updateEntry, deleteEntry, getLastEntry, getEntries, getBodyWeight } = useApp();
  const exercise = getExercise(exerciseId, data.customExercises || []);

  const [reps, setReps] = useState(5);
  const [sets, setSets] = useState(2);
  const [weight, setWeight] = useState(0);
  const [maxReps, setMaxReps] = useState(0);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeUser) return;

    const existing = getEntries({
      userId: activeUser.id,
      exercise: exerciseId,
      month,
      week,
    });

    if (existing.length > 0) {
      const entry = existing[0];
      setReps(entry.reps);
      setSets(entry.sets);
      setWeight(entry.weight);
      setMaxReps(entry.maxReps);
      setNotes(entry.notes);
      setDate(entry.date);
      setExistingId(entry.id);
      return;
    }

    const last = getLastEntry(activeUser.id, exerciseId, month, week);
    if (last) {
      setReps(last.reps);
      setSets(last.sets);
      setWeight(last.weight);
      setMaxReps(0);
      setNotes("");
    } else {
      setReps(5);
      setSets(2);
      setWeight(0);
      setMaxReps(0);
      setNotes("");
    }
    setExistingId(null);
    setDate(new Date().toISOString().split("T")[0]);
  }, [activeUser, exerciseId, month, week, getEntries, getLastEntry]);

  if (!activeUser || !exercise) return null;

  const bodyWeight = getBodyWeight(activeUser.id, month);
  const mockEntry = {
    reps, sets, weight, maxReps, exercise: exerciseId, userId: activeUser.id,
  } as WorkoutEntry;
  const effectiveWt = getEffectiveWeight(mockEntry, bodyWeight, data.customExercises || []);
  const volume = reps * sets * effectiveWt;
  const maxRepsVol = maxReps * effectiveWt;

  const handleSave = () => {
    const entryData = {
      userId: activeUser.id,
      exercise: exerciseId,
      month,
      week,
      date,
      reps,
      sets,
      weight,
      maxReps: maxReps || reps,
      notes,
    };

    if (existingId) {
      updateEntry(existingId, { reps, sets, weight, maxReps, notes, date });
      toast.success("Updated!");
    } else {
      addEntry(entryData);

      const fakeEntry = {
        ...entryData,
        id: "temp",
        createdAt: new Date().toISOString(),
      } as WorkoutEntry;

      const prs = detectPRs(fakeEntry, data.entries, bodyWeight, data.customExercises || []);
      if (prs.length > 0) {
        toast.success(
          `NEW PR! ${exercise.name} record broken!`,
          { duration: 5000, icon: "🏆" }
        );
      } else {
        toast.success("Saved!");
      }
    }
    onSaved?.();
  };

  const handleDelete = () => {
    if (existingId) {
      deleteEntry(existingId);
      setExistingId(null);
      setReps(5);
      setSets(2);
      setWeight(0);
      setMaxReps(0);
      setNotes("");
      toast.success("Deleted");
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">{exercise.name}</h3>
          {exercise.substitution && (
            <p className="text-[10px] text-white/20 mt-0.5">Sub: {exercise.substitution}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {existingId && (
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-medium text-blue-400">
              editing
            </span>
          )}
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/30">
            WK {week}
          </span>
        </div>
      </div>

      {/* Body weight info */}
      {exercise.usesBodyWeight && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 text-xs text-primary/80">
          Body weight: {bodyWeight > 0 ? `${bodyWeight} lbs` : "Not set (update on home page)"}
        </div>
      )}

      {/* Steppers */}
      <div className="flex justify-around">
        <Stepper label="Reps" value={reps} onChange={setReps} min={1} />
        <Stepper label="Sets" value={sets} onChange={setSets} min={1} />
        <Stepper
          label={exercise.usesBodyWeight ? "+lbs" : "Weight"}
          value={weight}
          onChange={setWeight}
          step={5}
        />
      </div>

      <div className="flex justify-around">
        <Stepper label="Max Reps" value={maxReps} onChange={setMaxReps} min={0} />
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-primary/40"
          />
        </div>
      </div>

      {/* Notes */}
      <input
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/40"
      />

      {/* Live stats */}
      <div className="flex justify-between rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 text-xs">
        <div>
          <span className="text-white/30">Vol </span>
          <span className="font-bold text-white">{volume.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-white/30">MRV </span>
          <span className="font-bold text-white">{maxRepsVol.toLocaleString()}</span>
        </div>
        {exercise.usesBodyWeight && (
          <div>
            <span className="text-white/30">Eff.Wt </span>
            <span className="font-bold text-primary">{effectiveWt}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(74,222,128,0.2)]"
        >
          <Save className="h-4 w-4" />
          {existingId ? "Update" : "Save"}
        </button>
        {existingId && (
          <button
            onClick={handleDelete}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
