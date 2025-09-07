import { NextRequest } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const goal = searchParams.get("goal") || "Crack frontend role in 30 days";
  const role = searchParams.get("role") || "";
  const company = searchParams.get("company") || "";
  const days = Number(searchParams.get("days") || 7);

  const { text } = await generateText({
    model: google("gemini-2.0-flash-001"),
    prompt: `Create a concise ${days}-day preparation plan for this goal: "${goal}".
Role: ${role}
Company: ${company}
Include:
- Daily objectives
- Topics to cover
- Practice tasks
- Short reflection prompts
Return plain text without any markdown symbols like ** or ##. Keep it under 300 words.`,
  });

  return Response.json({ success: true, plan: text });
}
