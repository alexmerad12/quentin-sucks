"use client";

import { useState } from "react";
import { useApp } from "@/lib/storage";
import { getCardioExercise, CARDIO_EXERCISES } from "@/lib/cardio-exercises";
import { calcMinPerKm, formatPace, formatDuration } from "@/lib/cardio-calculations";
import type { UserId, CardioEntry } from "@/types";
import { Trash2, Pencil, Check, X } from "lucide-react";

function CardioEntryCard({ entry, onDelete, onUpdate }: {
  entry: CardioEntry;
  onDelete: () => void;
  onUpdate: (updates: Partial<CardioEntry>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [distance, setDistance] = useState(entry.distance);
  const [duration, setDuration] = useState(entry.duration);
  const [notes, setNotes] = useState(entry.notes);

  const pace = entry.distance > 0 ? calcMinPerKm(entry) : 0;

  const handleSave = () => {
    onUpdate({ distance, duration, notes });
    setEditing(false);
  };

  const handleCancel = () => {
    setDistance(entry.distance);
    setDuration(entry.duration);
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-white/30 uppercase">Distance (km)</label>
            <input type="number" step="0.1" value={distance || ""} onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-white outline-none focus:border-primary/40" />
          </div>
          <div>
            <label className="text-[9px] text-white/30 uppercase">Duration (min)</label>
            <input type="number" value={duration || ""} onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-white outline-none focus:border-primary/40" />
          </div>
        </div>
        <div>
          <label className="text-[9px] text-white/30 uppercase">Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional"
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
          <button onClick={() => setEditing(true)}
            className="flex h-5 w-5 items-center justify-center rounded text-white/15 hover:text-primary hover:bg-primary/10 transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={onDelete}
            className="flex h-5 w-5 items-center justify-center rounded text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="text-base font-bold text-white">
        {entry.distance} km · {formatDuration(entry.duration)}
      </div>
      <div className="text-xs text-white/40">
        {pace > 0 ? formatPace(pace) : "--"} · {entry.duration > 0 ? (entry.distance / (entry.duration / 60)).toFixed(1) : 0} km/h
      </div>
      {entry.notes && (
        <div className="text-xs text-white/25 italic">{entry.notes}</div>
      )}
    </div>
  );
}

export function CardioHistoryTable({ exerciseId, userId, month }: {
  exerciseId: string;
  userId: UserId;
  month: string;
}) {
  const { getCardioEntries, deleteCardioEntry, updateCardioEntry } = useApp();
  const exercise = getCardioExercise(exerciseId);

  const entries = getCardioEntries({ userId, exercise: exerciseId, month });
  const sorted = [...entries].sort((a, b) => a.week - b.week);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{exercise?.emoji ?? "🏃"}</span>
          <span className="text-sm font-bold text-white">{exercise?.name ?? exerciseId}</span>
        </div>
        {sorted.length > 0 && (
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
            {sorted.length} sessions
          </span>
        )}
      </div>
      {sorted.length > 0 ? (
        <div className="p-3 space-y-2">
          {sorted.map((entry) => (
            <CardioEntryCard
              key={entry.id}
              entry={entry}
              onDelete={() => { if (confirm("Delete this entry?")) deleteCardioEntry(entry.id); }}
              onUpdate={(updates) => updateCardioEntry(entry.id, updates)}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-xs text-white/15">
          No sessions this month
        </div>
      )}
    </div>
  );
}
