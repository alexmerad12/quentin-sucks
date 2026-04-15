import type { CardioEntry } from "@/types";

export function calcSpeedKmh(entry: CardioEntry): number {
  if (entry.duration <= 0) return 0;
  return entry.distance / (entry.duration / 60);
}

export function calcMinPerKm(entry: CardioEntry): number {
  if (entry.distance <= 0) return 0;
  return entry.duration / entry.distance;
}

export function formatPace(minPerKm: number): string {
  if (minPerKm <= 0) return "--";
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${String(secs).padStart(2, "0")}/km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
