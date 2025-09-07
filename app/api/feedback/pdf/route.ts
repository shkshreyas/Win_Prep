import { NextRequest } from "next/server";
import { db } from "@/firebase/admin";

// Naive PDF buffer (minimal) – produces a valid PDF header/body
function escapePdfText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars: number): string[] {
  const wrapped: string[] = [];
  const rawLines = text.split(/\r?\n/);
  for (const raw of rawLines) {
    const words = raw.split(/\s+/);
    let line = "";
    for (const w of words) {
      if (!w) continue;
      if ((line + " " + w).trim().length > maxChars) {
        if (line) wrapped.push(line);
        line = w;
      } else {
        line = (line ? line + " " : "") + w;
      }
    }
    wrapped.push(line);
  }
  return wrapped;
}

function simplePdfFromText(title: string, content: string): Uint8Array {
  const left = 64; // ~0.9in
  const top = 760;
  const titleFontSize = 16;
  const bodyFontSize = 11;
  const leading = 14; // tighter to fit more lines

  const wrappedBody = wrapText(content, 90);
  const lines = [title, "", ...wrappedBody].map(escapePdfText);

  const parts: string[] = [];
  parts.push("BT");
  parts.push(`/F1 ${titleFontSize} Tf`);
  parts.push(`${left} ${top} Td`);
  parts.push(`${leading} TL`);
  parts.push(`(${lines[0] || ""}) Tj`);
  parts.push(`/F1 ${bodyFontSize} Tf`);
  for (let i = 1; i < lines.length; i++) {
    parts.push("T*");
    parts.push(`(${lines[i]}) Tj`);
  }
  parts.push("ET");

  const body = parts.join("\n");

  const pdf = `%PDF-1.4\n1 0 obj<<>>endobj\n2 0 obj<<>>endobj\n3 0 obj<< /Length ${
    body.length
  } >>stream\n${body}\nendstream endobj\n4 0 obj<< /Type /Page /Parent 5 0 R /Resources << /Font << /F1 6 0 R >> >> /Contents 3 0 R /MediaBox [0 0 612 792] >>endobj\n5 0 obj<< /Type /Pages /Kids [4 0 R] /Count 1 >>endobj\n6 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n7 0 obj<< /Type /Catalog /Pages 5 0 R >>endobj\nxref\n0 8\n0000000000 65535 f \n0000000010 00000 n \n0000000047 00000 n \n0000000084 00000 n \n0000000${
    160 + body.length
  } 00000 n \n0000000${220 + body.length} 00000 n \n0000000${
    270 + body.length
  } 00000 n \n0000000${
    330 + body.length
  } 00000 n \ntrailer<< /Size 8 /Root 7 0 R >>\nstartxref\n${
    380 + body.length
  }\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedbackId = searchParams.get("id");

  if (!feedbackId) {
    return new Response("Missing id", { status: 400 });
  }

  const docRef = db.collection("feedback").doc(feedbackId);
  const snap = await docRef.get();
  if (!snap.exists) return new Response("Not found", { status: 404 });
  const data = snap.data() as any;

  const content = `Total Score: ${data.totalScore}\n\nStrengths:\n- ${(
    data.strengths || []
  ).join("\n- ")}\n\nAreas for Improvement:\n- ${(
    data.areasForImprovement || []
  ).join("\n- ")}\n\nFinal Assessment:\n${data.finalAssessment || ""}`;

  const pdfBytes = simplePdfFromText("WinPrep Interview Feedback", content);

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=winprep-feedback-${feedbackId}.pdf`,
      "Content-Length": String(pdfBytes.byteLength),
    },
  });
}
