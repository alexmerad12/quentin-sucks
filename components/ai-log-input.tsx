"use client";

import { useState, useRef, useCallback } from "react";
import { useApp } from "@/lib/storage";
import { getCurrentMonth, getCurrentWeek } from "@/lib/calculations";
import { Sparkles, Send, Loader2, Check, X, Keyboard, Camera, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ParsedExercise {
  exercise: string;
  exerciseName: string;
  reps: number;
  sets: number;
  weight: number;
  maxReps: number;
  notes: string;
  isNew?: boolean;
}

export function AILogInput() {
  const { activeUser, addEntry, addCustomExercise, getAllExercises, data } = useApp();
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedExercise[] | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mediaType: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doParse = useCallback(async (inputText: string, imgData?: { base64: string; mediaType: string } | null) => {
    if (!inputText.trim() && !imgData) return;
    setIsLoading(true);
    setPreview(null);

    try {
      const body: Record<string, string> = {};
      if (inputText.trim()) body.text = inputText;
      if (imgData) {
        body.image = imgData.base64;
        body.imageMediaType = imgData.mediaType;
      }

      const res = await fetch("/api/parse-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse");
      }

      const data = await res.json();
      if (data.exercises && data.exercises.length > 0) {
        setPreview(data.exercises);
      } else {
        toast.error("Couldn't understand that — try again");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to parse workout");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, GIF, or WebP image");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Create preview URL
      setImagePreview(result);
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = result.split(",")[1];
      setImageData({ base64, mediaType: file.type });
    };
    reader.readAsDataURL(file);

    // Reset file input so same file can be re-selected
    e.target.value = "";
  }, []);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageData(null);
  }, []);

  if (!activeUser) return null;

  const handleConfirmAll = () => {
    if (!preview || !activeUser) return;

    const month = getCurrentMonth();
    const week = getCurrentWeek();
    const date = new Date().toISOString().split("T")[0];
    const existingExercises = getAllExercises();
    let newCount = 0;

    for (const ex of preview) {
      // Auto-create custom exercise if it doesn't exist
      const exists = existingExercises.some((e) => e.id === ex.exercise);
      if (!exists) {
        addCustomExercise({
          id: ex.exercise,
          name: ex.exerciseName,
          usesBodyWeight: false,
          isOptional: true,
          isCustom: true,
        });
        newCount++;
      }

      addEntry({
        userId: activeUser.id,
        exercise: ex.exercise,
        month,
        week,
        date,
        reps: ex.reps,
        sets: ex.sets,
        weight: ex.weight,
        maxReps: ex.maxReps || ex.reps,
        notes: ex.notes,
      });
    }

    const parts = [`Logged ${preview.length} exercise${preview.length > 1 ? "s" : ""}`];
    if (newCount > 0) parts.push(`created ${newCount} new`);
    toast.success(parts.join(", ") + "!", { icon: "💪" });
    setText("");
    setPreview(null);
    clearImage();
  };

  const handleRemoveExercise = (index: number) => {
    if (!preview) return;
    const next = preview.filter((_, i) => i !== index);
    setPreview(next.length === 0 ? null : next);
  };

  const canSend = text.trim() || imageData;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
            AI Log — type, voice, or photo
          </span>
        </div>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="Workout log"
            className="h-24 rounded-xl border border-white/10 object-cover"
          />
          <button
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            placeholder={imageData
              ? 'Add notes (optional) then hit send...'
              : 'Tap mic on your keyboard 🎤 or type:\n"squats 225 for 6, bench 185 for 5"'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doParse(text, imageData);
              }
            }}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/15 outline-none focus:border-primary/40 transition-colors resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {/* Photo button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex h-[30px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
          >
            <Camera className="h-4 w-4" />
          </button>
          {/* Send button */}
          <button
            onClick={() => doParse(text, imageData)}
            disabled={!canSend || isLoading}
            className="flex h-[30px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary/20 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Tip */}
      <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
        <Keyboard className="h-3.5 w-3.5 text-white/20 shrink-0" />
        <p className="text-[10px] text-white/20">
          Use 🎤 voice, type, or snap a photo of your workout log
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-white/40">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          {imageData ? "Reading your workout photo..." : "Analyzing your workout..."}
        </div>
      )}

      {/* Preview parsed exercises */}
      {preview && preview.length > 0 && (
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-primary">
              Found {preview.length} exercise{preview.length > 1 ? "s" : ""}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPreview(null)}
                className="flex h-7 items-center gap-1 rounded-lg bg-white/5 px-2.5 text-[10px] text-white/40 hover:bg-white/10"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
              <button
                onClick={handleConfirmAll}
                className="flex h-7 items-center gap-1 rounded-lg bg-primary px-3 text-[10px] font-bold text-black hover:brightness-110 active:scale-95"
              >
                <Check className="h-3 w-3" />
                Log All
              </button>
            </div>
          </div>

          {preview.map((ex, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{ex.exerciseName}</span>
                  {ex.isNew && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">New</span>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  {ex.reps} reps × {ex.sets} sets × {ex.weight} lbs
                  {ex.notes && <span className="italic text-white/20"> — {ex.notes}</span>}
                </div>
              </div>
              <button
                onClick={() => handleRemoveExercise(i)}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-white/20 hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
