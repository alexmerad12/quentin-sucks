import { NextResponse } from "next/server";
import { readServerData, writeServerData } from "@/lib/server-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = readServerData();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    writeServerData(body);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
