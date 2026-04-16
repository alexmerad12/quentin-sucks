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
      "isNew": false,
      "category": "Squat",
      "isDumbbell": false,
      "usesBodyWeight": false,
      "emoji": "🦵"
    }
  ]
}

Category groups exercises that are the SAME movement (just barbell vs dumbbell variant). Different movements get different categories. Use one of:
- "Squat" (back squat, goblet squat, dumbbell squat)
- "Deadlift" (conventional, sumo, Romanian)
- "Bench" (barbell bench, dumbbell bench, incline bench)
- "Shoulder Press" (OHP, dumbbell shoulder press, military press)
- "Pull-ups" (pull-ups, chin-ups)
- "Rows" (barbell row, dumbbell row, cable row, seated row)
- "Lat Pulldown" (lat pulldown, cable pulldown)
- "Dips" (dips, bench dips)
- "Triceps" (kickbacks, skull crushers, tricep extensions)
- "Push-ups" (push-ups, diamond push-ups)
- "Curls" (hammer curls, bicep curls, preacher curls)
- "Raises" (lateral raise, front raise)
- "Leg Press", "Leg Curl", "Lunges", "Calves"
- "Core" (crunches, planks, sit-ups)
- "Other" (anything else)
Pick an emoji that matches the exercise. Use these guidelines:
- Chest/bench/push-ups: 💪
- Shoulders/OHP: 🙌
- Back/rows/pull: 🔝
- Biceps/curls: 💪
- Triceps/dips/kickbacks: ⬇️
- Legs/squat/lunge: 🦵
- Deadlift: 🏋️
- Cardio/running: 🏃
- Core/abs/crunches: 🔥
- Boxing/striking: 🥊
- General/other: ⚡
Set isDumbbell to true if the exercise uses dumbbells (weight entered is per arm).
Set usesBodyWeight to true for exercises where your body is the resistance (pull-ups, dips, bench dips, push-ups, crunches, bicycle crunches, planks, lunges, etc.). For these exercises the user's body weight is added to any additional weight.

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
- Set "isNew": true ONLY for exercises that don't match ANY known or custom exercise

IMAGE PARSING RULES (when reading a photo of a workout log):

Workout logs come in DIFFERENT FORMATS. Identify which format first, then parse accordingly:

FORMAT A — List of sets (each line = 1 set):
- Shows each set as a separate line: "5 x 255 lb", "5 x 255 lb", "5 x 255 lb"
- Number BEFORE "x" is REPS, number AFTER is WEIGHT
- COUNT THE LINES to get SETS (e.g., 5 identical lines = 5 sets)
- Example: 5 lines of "5 x 255 lb" → reps: 5, sets: 5, weight: 255

FORMAT B — Red/colored circles indicating sets (Strong app, Hevy, etc.):
- Shows a HEADER like "Deadlift 5×250lb" which is the TARGET (prescribed weight × reps) — DO NOT use this as actual reps/sets
- Below the header are COLORED CIRCLES (red, green, blue) — each circle represents ONE COMPLETED SET
- The number INSIDE the circle is the REPS done in that set
- The small number BELOW the circle is the WEIGHT used for that set
- COUNT THE CIRCLES to get SETS (e.g., 2 circles = 2 sets)
- Example: Header "5×250lb", 2 circles showing "5" with "250" below and "5" with "235" below → reps: 5, sets: 2, weight: 250 (use heaviest)

HOW TO DETECT THE FORMAT:
- If you see COLORED CIRCLES with numbers inside them → Format B (count circles for sets)
- If you see REPEATED TEXT LINES like "5 x 255 lb" → Format A (count lines for sets)
- NEVER use the header "5×250lb" as both reps AND sets — that's only in Format A when listed multiple times

General rules for both formats:
- If sets have different weights, use the HEAVIEST weight
- Set maxReps to the highest rep count seen in any set
- Look for the exercise name as a title/header above the sets
- Ignore UI elements like checkmarks, exercise images, timers, calories, share/close buttons, body weight, date headers`;
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

    // Use Sonnet for images (better vision), Haiku for text (faster)
    const model = image ? "claude-sonnet-4-5" : "claude-haiku-4-5-20251001";

    async function callClaude() {
      return client.messages.create({
        model,
        max_tokens: 2048,
        system: buildSystemPrompt(customExerciseList),
        messages: [{ role: "user", content: contentParts }],
      });
    }

    function extractJson(text: string): any {
      // Try to extract JSON — handle markdown code blocks and loose text
      let cleaned = text.trim();
      // Strip markdown fences
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      // Try direct parse first
      try { return JSON.parse(cleaned); } catch {}
      // Fall back to greedy brace match
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try { return JSON.parse(match[0]); } catch { return null; }
    }

    // Try up to 2 times (sometimes model returns malformed JSON)
    let parsed: any = null;
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const message = await callClaude();
        const content = message.content[0];
        if (content.type !== "text") {
          lastError = "Unexpected response type";
          continue;
        }
        parsed = extractJson(content.text);
        if (parsed && parsed.exercises) break;
        lastError = "Could not parse response";
      } catch (err: any) {
        lastError = err.message || "API error";
      }
    }

    if (!parsed) {
      return NextResponse.json({ error: lastError || "Failed to parse" }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Parse workout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse workout" },
      { status: 500 }
    );
  }
}
