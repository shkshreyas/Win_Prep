"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function InterviewLobby() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [level, setLevel] = useState("Junior");
  const [techstack, setTechstack] = useState("React,TypeScript");
  const [amount, setAmount] = useState(8);
  const [type, setType] = useState("technical");
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const res = await fetch("/api/interview/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, company, level, techstack, amount, type }),
    });
    const json = await res.json();
    setLoading(false);
    if (json?.id) {
      window.location.href = "/interview/" + json.id;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Set up your interview</h1>
        <div className="grid gap-3">
          <label className="text-sm">Company</label>
          <input
            className="input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Google"
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Role</label>
          <input
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Frontend Engineer"
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Level</label>
          <input
            className="input"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Tech stack (comma-separated)</label>
          <input
            className="input"
            value={techstack}
            onChange={(e) => setTechstack(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Number of questions</label>
          <input
            className="input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value || "8"))}
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm">Focus</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="technical">Technical</option>
            <option value="behavioural">Behavioural</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <Button onClick={start} disabled={loading} className="btn-primary">
          {loading ? "Preparing..." : "Start Interview"}
        </Button>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-lg">
        <p className="text-muted-foreground">
          Your AI interviewer will ask {amount} {type} questions for the{" "}
          {role || "role"} role at {company || "company"}. Make sure your mic is
          enabled.
        </p>
      </div>
    </div>
  );
}
