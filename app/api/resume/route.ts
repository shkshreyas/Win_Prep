import { NextRequest } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { db } from "@/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const userId = (json.userId as string) || "";
    const role = (json.role as string) || "";
    const company = (json.company as string) || "";
    const resumeText = (json.resumeText as string) || "";

    if (!resumeText || !userId) {
      return Response.json(
        { success: false, error: "Missing resumeText or userId" },
        { status: 400 }
      );
    }

    const { text: analysisRaw } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Analyze this resume for an interview context.
Role: ${role}
Company: ${company}
Resume Text:
"""
${resumeText}
"""

Provide:
- Summary of candidate profile
- Key strengths aligned to the role
- Gaps or risks
- Suggested STAR stories to prepare
- 10 likely interview questions
Keep it concise and structured with headings. Return plain text without any markdown symbols like ** or ## or code fences.
`,
    });

    const analysis = analysisRaw
      .replace(/```+/g, "")
      .replace(/\*\*/g, "")
      .replace(/##+/g, "")
      .trim();

    const doc = await db.collection("resumeAnalyses").add({
      userId,
      role,
      company,
      resumeBytesStored: false,
      analysis,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ success: true, id: doc.id, analysis });
  } catch (error) {
    console.error("Resume analysis error", error);
    return Response.json({ success: false }, { status: 500 });
  }
}
