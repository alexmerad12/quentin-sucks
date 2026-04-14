import { NextRequest, NextResponse } from "next/server";
import { readServerData, writeServerData } from "@/lib/server-storage";
import type { ExerciseConfig } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const exercise: ExerciseConfig = await req.json();
    const data = readServerData();
    // Avoid duplicates by ID
    if (!data.customExercises.some((e) => e.id === exercise.id)) {
      data.customExercises.push(exercise);
      writeServerData(data);
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const data = readServerData();
    data.customExercises = data.customExercises.filter((e) => e.id !== id);
    writeServerData(data);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
