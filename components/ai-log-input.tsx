"use client";

import { useState, useRef } from "react";
import { useApp } from "@/lib/storage";
import { parseWorkoutText, generateSuggestion } from "@/lib/ai-parser";
import { getCurrentMonth, getCurrentWeek, detectPRs } from "@/lib/calculations";
import { getExercise } from "@/lib/exercises";
import type { WorkoutEntry } from "@/types";
import { Sparkles, Send, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

export function AILogInput() {
  const { activeUser, addEntry, data, getBodyWeight } = useApp();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!activeUser) return null;

  const parsed = text.trim()
    ? parseWorkoutText(text, data.customExercises || [])
    : null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Use browser SpeechRecognition API
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          // Already handled by recognition below
        } else {
          toast.error("Speech recognition not supported in this browser");
        }
      };

      // Use Web Speech API for real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech error:", event.error);
          setIsRecording(false);
          if (event.error === "not-allowed") {
            toast.error("Microphone access denied");
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        mediaRecorder.start();
        setIsRecording(true);
        toast.success("Listening...", { duration: 1500 });
      } else {
        toast.error("Speech recognition not available — try Chrome");
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      toast.error("Couldn't access microphone");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (!parsed || !parsed.exercise) {
      toast.error("Couldn't parse that. Try: 'bench 5 reps 2 sets 185 lbs'");
      return;
    }

    const month = getCurrentMonth();
    const week = getCurrentWeek();

    addEntry({
      userId: activeUser.id,
      exercise: parsed.exercise,
      month,
      week,
      date: new Date().toISOString().split("T")[0],
      reps: parsed.reps ?? 5,
      sets: parsed.sets ?? 1,
      weight: parsed.weight ?? 0,
      maxReps: parsed.maxReps ?? parsed.reps ?? 5,
      notes: parsed.notes || `AI: "${text}"`,
    });

    const bodyWeight = getBodyWeight(activeUser.id, month);
    const fakeEntry = {
      userId: activeUser.id,
      exercise: parsed.exercise,
      month,
      week,
      date: new Date().toISOString().split("T")[0],
      reps: parsed.reps ?? 5,
      sets: parsed.sets ?? 1,
      weight: parsed.weight ?? 0,
      maxReps: parsed.maxReps ?? parsed.reps ?? 5,
      notes: "",
      id: "temp",
      createdAt: new Date().toISOString(),
    } as WorkoutEntry;

    const prs = detectPRs(fakeEntry, data.entries, bodyWeight, data.customExercises || []);
    const exConfig = getExercise(parsed.exercise, data.customExercises || []);

    if (prs.length > 0) {
      toast.success(`NEW PR! ${exConfig?.name} record broken!`, { duration: 5000, icon: "🏆" });
    } else {
      toast.success(`Logged ${exConfig?.name}: ${parsed.sets ?? 1}x${parsed.reps ?? 5} @ ${parsed.weight ?? 0}lbs`);
    }
    setText("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
        <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
          Quick AI Log
        </span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            placeholder='"bench 5 reps 2 sets 185 lbs"'
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && parsed?.confidence && parsed.confidence >= 0.4) {
                handleSubmit();
              }
            }}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm text-white placeholder:text-white/15 outline-none focus:border-primary/40 transition-colors"
          />
          {/* Voice button inside input */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90 ${
              isRecording
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
            }`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!parsed || parsed.confidence < 0.4}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary/20 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Live preview */}
      {parsed && text.length > 3 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-white/60">{generateSuggestion(parsed)}</span>
            <span className={`font-mono text-[10px] ${
              parsed.confidence >= 0.6 ? "text-primary" : "text-white/20"
            }`}>
              {Math.round(parsed.confidence * 100)}%
            </span>
          </div>
          {!parsed.exercise && (
            <p className="text-red-400/60 mt-1">Can&apos;t identify exercise</p>
          )}
        </div>
      )}
    </div>
  );
}
