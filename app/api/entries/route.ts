import { NextRequest, NextResponse } from "next/server";
import { readServerData, writeServerData } from "@/lib/server-storage";
import type { WorkoutEntry } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const entry: WorkoutEntry = await req.json();
    const data = readServerData();
    data.entries.push(entry);
    writeServerData(data);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const data = readServerData();
    data.entries = data.entries.filter((e) => e.id !== id);
    writeServerData(data);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, updates } = await req.json();
    const data = readServerData();
    data.entries = data.entries.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    writeServerData(data);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
