"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf") {
      alert("For now, please open your PDF and paste its text here.");
      return;
    } else {
      const text = await file.text();
      setResumeText(text);
    }
  };

  const analyze = async () => {
    setLoading(true);
    setAnalysis(null);
    const res = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, company, resumeText, userId: "me" }),
    });
    const json = await res.json();
    setAnalysis(json.analysis || "");
    setLoading(false);
  };

  const downloadPdf = async () => {
    if (!analysis) return;
    const res = await fetch("/api/plan/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "WinPrep Resume Analysis",
        content: analysis,
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "winprep-resume-analysis.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Prepare with your resume</h1>
        <div className="grid gap-3">
          <label className="text-sm">Target role</label>
          <input
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Frontend Engineer"
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Company (optional)</label>
          <input
            className="input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Stripe"
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Upload resume (PDF/TXT)</label>
          <input
            className="input"
            type="file"
            accept=".pdf,.txt"
            onChange={onFile}
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Or paste resume text</label>
          <textarea
            className="textarea h-56"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume plain text here..."
          />
        </div>
        <div className="flex gap-3">
          <Button onClick={analyze} disabled={loading} className="btn-primary">
            {loading ? "Analyzing..." : "Analyze Resume"}
          </Button>
          <Button onClick={downloadPdf} disabled={!analysis} variant="outline">
            Download PDF
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-lg min-h-[200px] whitespace-pre-wrap">
        {analysis ? (
          analysis
        ) : (
          <p className="text-muted-foreground">
            Your analysis will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
