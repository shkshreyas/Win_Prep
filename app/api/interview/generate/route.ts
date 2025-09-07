import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const {
    type = "technical",
    role = "",
    level = "",
    techstack = "",
    amount = 8,
    userid = "",
    company = "",
  } = await request.json();

  try {
    const { text: questionsRaw } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Constraints:
        - Questions must be UNIQUE and non-repetitive.
        - Avoid near-duplicates by varying focus and phrasing.
        - Mix foundational and scenario-based questions.
        Please return only the questions, without any additional text, code fences, or comments.
        The questions will be read by speech synthesis, so avoid special characters.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
    `,
    });

    // Parse and sanitize questions output
    let parsed: string[] = [];
    try {
      const text = questionsRaw
        .replace(/^```json/gi, "")
        .replace(/^```/gi, "")
        .replace(/```$/g, "")
        .trim();
      parsed = JSON.parse(text);
    } catch {
      const match = questionsRaw.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    const unique = Array.from(
      new Set((parsed || []).map((q: string) => (q || "").trim()))
    ).filter(Boolean);
    const finalQuestions = unique.slice(0, Math.max(1, Number(amount) || 8));

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: (techstack || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      questions: finalQuestions,
      userId: userid || "",
      finalized: true,
      coverImage: getRandomInterviewCover(),
      company: company || "",
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("interviews").add(interview);

    return Response.json({ success: true, id: ref.id }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}
