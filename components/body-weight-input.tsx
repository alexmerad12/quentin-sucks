"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/storage";
import { Scale, Check, X } from "lucide-react";
import { toast } from "sonner";

interface BodyWeightInputProps {
  month: string;
}

export function BodyWeightInput({ month }: BodyWeightInputProps) {
  const { activeUser, getBodyWeight, setBodyWeight } = useApp();
  const [weight, setWeight] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (activeUser) {
      setWeight(getBodyWeight(activeUser.id, month));
    }
  }, [activeUser, month, getBodyWeight]);

  if (!activeUser) return null;

  const currentWeight = getBodyWeight(activeUser.id, month);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-white/30 transition-colors hover:border-white/10 hover:text-white/50"
      >
        <Scale className="h-3.5 w-3.5" />
        {currentWeight ? `${currentWeight} lbs` : "Set body weight"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Scale className="h-3.5 w-3.5 text-white/30" />
      <input
        type="number"
        value={weight || ""}
        onChange={(e) => setWeight(Number(e.target.value) || 0)}
        placeholder="lbs"
        className="h-8 w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-center text-xs text-white outline-none focus:border-primary/40"
        autoFocus
      />
      <button
        onClick={() => {
          if (weight > 0) {
            setBodyWeight(activeUser.id, month, weight);
            toast.success("Saved");
          }
          setEditing(false);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setEditing(false)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
