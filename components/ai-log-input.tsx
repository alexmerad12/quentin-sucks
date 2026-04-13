"use client";

import { useState, useRef, useCallback } from "react";
import { useApp } from "@/lib/storage";
import { getCurrentMonth, getCurrentWeek } from "@/lib/calculations";
import { Sparkles, Send, Mic, Square, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ParsedExercise {
  exercise: string;
  exerciseName: string;
  reps: number;
  sets: number;
  weight: number;
  maxReps: number;
  notes: string;
}

export function AILogInput() {
  const { activeUser, addEntry, data } = useApp();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedExercise[] | null>(null);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef("");
  const shouldAutoParseRef = useRef(false);

  const doParse = useCallback(async (inputText: string) => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setPreview(null);

    try {
      const res = await fetch("/api/parse-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
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

  if (!activeUser) return null;

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not available — use Chrome");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    latestTranscriptRef.current = "";
    shouldAutoParseRef.current = false;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      latestTranscriptRef.current = transcript;
      setText(transcript);
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Auto-parse when voice stops (if user tapped stop)
      if (shouldAutoParseRef.current && latestTranscriptRef.current.trim()) {
        doParse(latestTranscriptRef.current);
      }
    };

    recognition.start();
    setIsRecording(true);
    toast.success("Listening... tap stop when done", { duration: 2000 });
  };

  const stopRecording = () => {
    shouldAutoParseRef.current = true; // flag to auto-parse on end
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleConfirmAll = () => {
    if (!preview || !activeUser) return;

    const month = getCurrentMonth();
    const week = getCurrentWeek();
    const date = new Date().toISOString().split("T")[0];

    for (const ex of preview) {
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

    toast.success(`Logged ${preview.length} exercise${preview.length > 1 ? "s" : ""}!`, { icon: "💪" });
    setText("");
    setPreview(null);
  };

  const handleRemoveExercise = (index: number) => {
    if (!preview) return;
    const next = preview.filter((_, i) => i !== index);
    setPreview(next.length === 0 ? null : next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
        <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
          AI Log — describe your workout
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <textarea
            placeholder={'e.g. "squats 225 for 6 reps 2 sets, bench 185 for 5, and pull-ups"'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doParse(text);
              }
            }}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm text-white placeholder:text-white/15 outline-none focus:border-primary/40 transition-colors resize-none"
          />
          {/* Voice button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg transition-all active:scale-90 ${
              isRecording
                ? "bg-red-500/20 text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
            }`}
          >
            {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
        <button
          onClick={() => {
            if (isRecording) {
              recognitionRef.current?.stop();
              setIsRecording(false);
            }
            doParse(text);
          }}
          disabled={!text.trim() || isLoading}
          className="flex h-[62px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary/20 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-white/40">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          Analyzing your workout...
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
                <div className="text-sm font-medium text-white">{ex.exerciseName}</div>
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
