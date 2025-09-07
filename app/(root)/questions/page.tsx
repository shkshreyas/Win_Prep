"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function QuestionsPage() {
  const [role, setRole] = useState("software engineer");
  const [company, setCompany] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [perQuestionSec, setPerQuestionSec] = useState(30);
  const [num, setNum] = useState(5);

  const load = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/latest-questions?role=${encodeURIComponent(role)}`
    );
    const json = await res.json();
    setItems(json.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!quiz || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [quiz, timeLeft]);

  const startQuiz = async () => {
    setLoading(true);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, company, num }),
    });
    const json = await res.json();
    setQuiz(json.items || []);
    setAnswers(Array((json.items || []).length).fill(-1));
    setTimeLeft((json.items || []).length * perQuestionSec);
    setLoading(false);
  };

  const score = useMemo(() => {
    if (!quiz) return 0;
    return quiz.reduce(
      (acc, q, idx) => (answers[idx] === q.correctIndex ? acc + 1 : acc),
      0
    );
  }, [answers, quiz]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <label className="text-sm">Role</label>
          <input
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Backend Engineer"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Company</label>
          <input
            className="input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Google"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Questions</label>
          <input
            className="input"
            type="number"
            value={num}
            onChange={(e) => setNum(parseInt(e.target.value || "5"))}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Sec/question</label>
          <input
            className="input"
            type="number"
            value={perQuestionSec}
            onChange={(e) =>
              setPerQuestionSec(parseInt(e.target.value || "30"))
            }
          />
        </div>
        <Button onClick={load} disabled={loading} className="btn-primary">
          {loading ? "Loading..." : "Refresh"}
        </Button>
        <Button onClick={startQuiz} disabled={loading} variant="secondary">
          {loading ? "Preparing..." : "Start Quiz"}
        </Button>
      </div>

      {!quiz && (
        <div className="grid gap-4">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border/50 bg-card p-4 hover:bg-accent"
            >
              <div className="text-sm text-muted-foreground">{item.source}</div>
              <div className="font-medium">{item.title}</div>
            </a>
          ))}
          {!items.length && !loading && (
            <p className="text-muted-foreground">
              No items found. Try a different role.
            </p>
          )}
        </div>
      )}

      {quiz && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Quiz</h2>
            <div className="text-sm text-muted-foreground">
              Time left: {timeLeft}s
            </div>
          </div>
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
            </div>
          ))}
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="font-semibold">
              Your score: {score}/{quiz.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Weak points:{" "}
              {quiz
                .map((q, i) =>
                  answers[i] !== q.correctIndex
                    ? q.question.split(" ").slice(0, 3).join(" ") + "…"
                    : null
                )
                .filter(Boolean)
                .join(", ") || "None"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
