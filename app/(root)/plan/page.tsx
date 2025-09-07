"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PlanPage() {
  const [goal, setGoal] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [num, setNum] = useState(5);
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const generate = async () => {
    setLoading(true);
    setPlan("");
    const computedGoal =
      goal ||
      `Prepare for ${role}${company ? ` at ${company}` : ""} in ${days} days`;
    const params = new URLSearchParams({
      goal: computedGoal,
      role,
      company,
      days: String(days),
    });
    const res = await fetch("/api/plan?" + params.toString());
    const json = await res.json();
    setPlan(json.plan || "");
    setLoading(false);
  };

  const downloadPdf = async () => {
    const res = await fetch("/api/plan/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "WinPrep Interview Plan", content: plan }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "winprep-plan.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateQuiz = async () => {
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, company, num }),
    });
    const json = await res.json();
    const items = json.items || [];
    setQuiz(items);
    setAnswers(Array(items.length).fill(-1));
  };

  const score = useMemo(() => {
    if (!quiz) return 0;
    return quiz.reduce(
      (acc, q, idx) => (answers[idx] === q.correctIndex ? acc + 1 : acc),
      0
    );
  }, [answers, quiz]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Weekly Plan (Preview)</h1>
        <div className="grid gap-3">
          <label className="text-sm">Your goal</label>
          <input
            className="input"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Role</label>
          <input
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Company</label>
          <input
            className="input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Days left</label>
          <input
            className="input"
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value || "7"))}
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Quiz questions</label>
          <input
            className="input"
            type="number"
            value={num}
            onChange={(e) => setNum(parseInt(e.target.value || "5"))}
          />
        </div>
        <div className="flex gap-3">
          <Button onClick={generate} disabled={loading} className="btn-primary">
            {loading ? "Generating..." : "Generate Plan"}
          </Button>
          <Button onClick={downloadPdf} disabled={!plan} variant="outline">
            Download PDF
          </Button>
          <Button
            onClick={generateQuiz}
            disabled={!role && !company}
            variant="secondary"
          >
            Generate Quiz
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-lg min-h-[200px] whitespace-pre-wrap">
        {plan || (
          <p className="text-muted-foreground">
            Your 7-day plan will appear here.
          </p>
        )}
      </div>
      {quiz && (
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">
            Quiz for {role || "role"}
            {company ? ` at ${company}` : ""}
          </h2>
          {quiz.map((q, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/50 bg-card p-4"
            >
              <div className="font-medium mb-2">
                {idx + 1}. {q.question}
              </div>
              <div className="grid gap-2">
                {q.options.map((opt: string, oi: number) => (
                  <label
                    key={oi}
                    className={`rounded-md border px-3 py-2 cursor-pointer ${
                      answers[idx] === oi
                        ? "bg-primary/10 border-primary"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      className="mr-2"
                      checked={answers[idx] === oi}
                      onChange={() =>
                        setAnswers((a) =>
                          a.map((v, vi) => (vi === idx ? oi : v))
                        )
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {answers[idx] !== -1 && (
                <div className="text-sm mt-2">
                  {answers[idx] === q.correctIndex
                    ? "✅ Correct"
                    : `❌ Incorrect. Correct: ${q.options[q.correctIndex]}`}
                </div>
              )}
            </div>
          ))}
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="font-semibold">
              Your score: {score}/{quiz.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
