import { NextRequest, NextResponse } from "next/server";
import { CRITERIA_PROMPT } from "@/lib/gemini/criteria";

// Server-side only: keeps the free-tier Gemini API key out of the client bundle.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    professionalScore: { type: "integer", description: "0-10, executive/professional look and engagement" },
    framingStyle: { type: "string", description: "e.g. wide, medium, close-up, over-the-shoulder, POV" },
    moodTags: { type: "array", items: { type: "string" } },
    isSelfieInGroup: { type: "boolean" },
    eyeContactIssue: { type: "boolean", description: "true if it breaks the candid/posed eye-contact rule" },
    suggestedKeep: { type: "boolean" },
    notes: { type: "string", description: "one short sentence explaining the call" },
  },
  required: [
    "professionalScore",
    "framingStyle",
    "moodTags",
    "isSelfieInGroup",
    "eyeContactIssue",
    "suggestedKeep",
    "notes",
  ],
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server (.env.local)" },
      { status: 500 }
    );
  }

  const { imageBase64, mimeType } = await req.json();
  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "Missing imageBase64 or mimeType" }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: CRITERIA_PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (res.status === 429) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: `Gemini error: ${body}` }, { status: 502 });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: "Empty response from Gemini" }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not parse Gemini response" }, { status: 502 });
  }
}
