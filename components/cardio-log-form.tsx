"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/storage";
import { getCardioExercise } from "@/lib/cardio-exercises";
import { calcSpeedKmh, calcMinPerKm, formatPace, formatDuration } from "@/lib/cardio-calculations";
import type { CardioEntry } from "@/types";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CardioLogFormProps {
  exerciseId: string;
  month: string;
  week: number;
}

export function CardioLogForm({ exerciseId, month, week }: CardioLogFormProps) {
  const { activeUser, addCardioEntry, updateCardioEntry, deleteCardioEntry, getCardioEntries } = useApp();
  const exercise = getCardioExercise(exerciseId);

  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeUser) return;
    const entries = getCardioEntries({ userId: activeUser.id, exercise: exerciseId, month, week });
    if (entries.length > 0) {
      const entry = entries[entries.length - 1];
      setDistance(entry.distance);
      setDuration(entry.duration);
      setNotes(entry.notes);
      setExistingId(entry.id);
    } else {
      setDistance(0);
      setDuration(0);
      setNotes("");
      setExistingId(null);
    }
  }, [activeUser, exerciseId, month, week, getCardioEntries]);

  if (!activeUser || !exercise) return null;

  const preview: CardioEntry = {
    id: "", userId: activeUser.id, exercise: exerciseId,
    date: "", month, week, distance, duration, notes, createdAt: "",
  };
  const speed = calcSpeedKmh(preview);
  const pace = calcMinPerKm(preview);

  const handleSave = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentWeek = Math.ceil(now.getDate() / 7);
    let date: string;
    if (month === currentMonth && week === currentWeek) {
      date = now.toISOString().split("T")[0];
    } else {
      const [y, m] = month.split("-").map(Number);
      const day = (week - 1) * 7 + 1;
      date = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    if (existingId) {
      updateCardioEntry(existingId, { distance, duration, notes });
      toast.success("Updated!");
    } else {
      addCardioEntry({
        userId: activeUser.id,
        exercise: exerciseId,
        month,
        week,
        date,
        distance,
        duration,
        notes,
      });
      toast.success(`${exercise.emoji} Logged ${distance} km!`);
    }
  };

  const handleDelete = () => {
    if (existingId && confirm("Delete this entry?")) {
      deleteCardioEntry(existingId);
      setExistingId(null);
      setDistance(0);
      setDuration(0);
      setNotes("");
      toast.success("Deleted");
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{exercise.emoji}</span>
          <span className="text-sm font-bold text-white">{exercise.name}</span>
        </div>
        {existingId && (
          <span className="rounded bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase">Editing</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-wider">Distance (km)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={distance || ""}
            onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
            placeholder="0.0"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg font-bold text-white placeholder:text-white/15 outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-wider">Duration (min)</label>
          <input
            type="number"
            step="1"
            min="0"
            value={duration || ""}
            onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg font-bold text-white placeholder:text-white/15 outline-none focus:border-primary/40"
          />
        </div>
      </div>

      {/* Live stats */}
      {distance > 0 && duration > 0 && (
        <div className="flex gap-4 rounded-xl bg-primary/[0.05] border border-primary/10 px-4 py-2.5">
          <div className="text-center flex-1">
            <div className="text-sm font-bold text-primary">{speed.toFixed(1)} km/h</div>
            <div className="text-[9px] text-white/25">speed</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-sm font-bold text-primary">{formatPace(pace)}</div>
            <div className="text-[9px] text-white/25">pace</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-sm font-bold text-white">{formatDuration(duration)}</div>
            <div className="text-[9px] text-white/25">time</div>
          </div>
        </div>
      )}

      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/15 outline-none focus:border-primary/40"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={distance <= 0 && duration <= 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {existingId ? "Update" : "Log"}
        </button>
        {existingId && (
          <button
            onClick={handleDelete}
            className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
