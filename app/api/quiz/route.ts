import { NextRequest } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: NextRequest) {
  const { role = "", company = "", num = 5 } = await request.json();

  const { text } = await generateText({
    model: google("gemini-2.0-flash-001"),
    prompt: `Create a ${num}-question multiple-choice quiz for role: ${role} at company: ${company}.
Return ONLY valid JSON array of objects with keys: question, options (array of 4 strings), correctIndex (0-3), explanation.
No markdown, no comments, no extra text. Ensure questions are unique.`,
  });

  const clean = text
    .replace(/^```json/gi, "")
    .replace(/^```/gi, "")
    .replace(/```$/g, "")
    .trim();
  let items = [] as any[];
  try {
    items = JSON.parse(clean);
  } catch {
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) items = JSON.parse(match[0]);
  }

  return Response.json({ success: true, items });
}
