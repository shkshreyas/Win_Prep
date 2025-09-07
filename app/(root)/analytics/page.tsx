export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Analytics (Preview)</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-6 min-h-40">
          Score over time (chart placeholder)
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6 min-h-40">
          Category strengths (chart placeholder)
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-6 min-h-40">
        Readiness score (gauge placeholder)
      </div>
    </div>
  );
}
