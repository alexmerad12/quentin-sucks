import { NextRequest, NextResponse } from "next/server";
import { readServerData, writeServerData } from "@/lib/server-storage";
import type { UserId } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId, month, weight } = (await req.json()) as {
      userId: UserId;
      month: string;
      weight: number;
    };
    const data = await readServerData();
    const user = data.users[userId];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const existing = user.bodyWeights.findIndex((b) => b.month === month);
    if (existing >= 0) {
      user.bodyWeights[existing] = { month, weight };
    } else {
      user.bodyWeights.push({ month, weight });
    }
    await writeServerData(data);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
