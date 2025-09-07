"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function analyzeResponse(question: string, response: string) {
  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `As an AI interviewer, analyze this response.
Question: ${question}
Response: ${response}

Return ONLY valid JSON with keys: "score" (0-100 integer) and "feedback" (string). No code fences, no comments, no extra text.
`,
    });

    const clean = text
      .replace(/^```json/gi, "")
      .replace(/^```/gi, "")
      .replace(/```$/g, "")
      .trim();
    return JSON.parse(clean);
  } catch (error) {
    console.error("Error analyzing response:", error);
    return null;
  }
}

export async function getFollowUpQuestion(
  question: string,
  response: string,
  context: string
) {
  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `You are an expert interviewer.
Question: ${question}
Candidate response: ${response}
Conversation context so far:
${context}

If a targeted follow-up question would clarify gaps, ask ONE concise follow-up.
Otherwise, return exactly the string: NONE.

Rules:
- Keep the follow-up under 20 words.
- Do not include commentary, only the question text.
`,
    });

    const trimmed = text.trim();
    if (trimmed.toUpperCase() === "NONE") return null;
    return trimmed.replace(/^"|"$/g, "");
  } catch (error) {
    console.error("Error generating follow-up:", error);
    return null;
  }
}
