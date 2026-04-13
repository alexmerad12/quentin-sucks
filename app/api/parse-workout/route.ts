import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a workout log parser. The user will describe their workout in natural language. Extract ALL exercises they mention and return structured JSON.

Known exercise IDs and their aliases:
- "squat" = squat, squats, back squat
- "deadlift" = deadlift, deadlifts, deads, DL
- "bench" = bench, bench press, flat bench, DB press, dumbbell press
- "ohp" = OHP, overhead press, shoulder press, military press
- "pullups" = pull-ups, pull ups, pullups, chin-ups, chin ups
- "dips" = dips, dip
- "leg-press" = leg press

If the exercise doesn't match any known ID, use a lowercase kebab-case ID (e.g. "bicep-curls").

Return ONLY valid JSON in this exact format, no other text:
{
  "exercises": [
    {
      "exercise": "squat",
      "exerciseName": "Squat",
      "reps": 6,
      "sets": 2,
      "weight": 225,
      "maxReps": 6,
      "notes": ""
    }
  ]
}

Rules:
- If reps aren't mentioned, default to 5
- If sets aren't mentioned, default to 1
- If weight isn't mentioned, default to 0
- maxReps = the highest rep count they mention for that exercise (same as reps if not specified)
- For pull-ups and dips, weight means ADDITIONAL weight beyond body weight
- Parse ALL exercises mentioned, even if described casually
- notes should capture any extra context like "felt easy", "bad form", etc.
- If the user mentions something like "3x225" that means 3 sets at 225 lbs (reps default to 5)
- "225 for 5" means 225 lbs for 5 reps
- "5x5 at 225" means 5 sets of 5 reps at 225 lbs`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Parse workout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse workout" },
      { status: 500 }
    );
  }
}
