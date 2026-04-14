import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { readServerData } from "@/lib/server-storage";
import { EXERCISES } from "@/lib/exercises";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(customExerciseList: string): string {
  return `You are a workout log parser. The user will describe their workout in natural language. Extract ALL exercises they mention and return structured JSON.

IMPORTANT: Match exercises carefully. Each distinct exercise variation is its OWN exercise.
- "bench press" (barbell) is a DIFFERENT exercise from "dumbbell bench press"
- "shoulder press" (barbell) is a DIFFERENT exercise from "dumbbell shoulder press"
- Only match to a known exercise ID if the user means EXACTLY that exercise

Known exercise IDs and their aliases (ONLY match these for the exact barbell/standard version):
- "squat" = squat, squats, back squat (NOT goblet squat, front squat, etc.)
- "deadlift" = deadlift, deadlifts, deads, DL (NOT Romanian deadlift, sumo deadlift, etc.)
- "bench" = bench, bench press, flat bench, barbell bench (NOT dumbbell bench, incline bench, etc.)
- "ohp" = OHP, overhead press, shoulder press, military press (NOT dumbbell shoulder press, etc.)
- "pullups" = pull-ups, pull ups, pullups, chin-ups, chin ups
- "dips" = dips, dip
- "leg-press" = leg press

${customExerciseList ? `Custom exercises (ALWAYS prefer matching these if they exist):\n${customExerciseList}\n` : ""}

EXERCISE MATCHING RULES:
1. First, try to match against custom exercises (exact or very close match)
2. Then try known exercise IDs above, but ONLY for the exact standard version
3. Any variation with "dumbbell", "DB", "incline", "decline", "cable", "machine", "seated", "standing", etc. is a SEPARATE exercise — create it as new if it doesn't already exist as a custom exercise
4. If NO match is found at all, create a NEW exercise: use a lowercase kebab-case ID and set "isNew": true
5. For fuzzy matches (e.g., "dead lifts" = "deadlift", misspellings), match to the correct existing exercise
6. The word "shoulder" or "overhead" always means a shoulder press movement, never bench

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
      "notes": "",
      "isNew": false
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
- "5x5 at 225" means 5 sets of 5 reps at 225 lbs
- Set "isNew": true ONLY for exercises that don't match ANY known or custom exercise`;
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, image, imageMediaType } = body as {
      text?: string;
      image?: string; // base64 encoded image
      imageMediaType?: ImageMediaType;
    };

    if (!text && !image) {
      return NextResponse.json({ error: "No text or image provided" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Build custom exercise list from server data
    const serverData = await readServerData();
    const allExercises = [...EXERCISES, ...(serverData.customExercises || [])];
    const customExerciseList = allExercises
      .map((e) => `- "${e.id}" = ${e.name}`)
      .join("\n");

    // Build message content — text, image, or both
    const contentParts: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (image) {
      contentParts.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType || "image/jpeg",
          data: image,
        },
      });
      // Add instruction for image parsing
      contentParts.push({
        type: "text",
        text: text
          ? `Here is an image of my workout log. Also: ${text}`
          : "Read this image of my workout log and extract all exercises, sets, reps, and weights you can see.",
      });
    } else {
      contentParts.push({ type: "text", text: text! });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: buildSystemPrompt(customExerciseList),
      messages: [
        {
          role: "user",
          content: contentParts,
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
