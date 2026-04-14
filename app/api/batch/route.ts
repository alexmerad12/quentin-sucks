import { NextRequest, NextResponse } from "next/server";
import { readServerData, writeServerData } from "@/lib/server-storage";
import type { WorkoutEntry, ExerciseConfig } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { entries, customExercises } = (await req.json()) as {
      entries: WorkoutEntry[];
      customExercises?: ExerciseConfig[];
    };

    const data = await readServerData();

    // Add custom exercises (skip duplicates)
    if (customExercises && customExercises.length > 0) {
      for (const ex of customExercises) {
        if (!data.customExercises.some((e) => e.id === ex.id)) {
          data.customExercises.push(ex);
        }
      }
    }

    // Add all entries
    data.entries.push(...entries);

    await writeServerData(data);
    return NextResponse.json({ ok: true, count: entries.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
