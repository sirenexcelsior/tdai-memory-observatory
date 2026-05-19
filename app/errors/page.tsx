import { getErrorsPageData } from "@/lib/tdai";
import { PageSection, StatusBadge } from "@/components/ui";

export default async function ErrorsPage() {
  const data = await getErrorsPageData();

  return (
    <>
      <PageSection
        eyebrow="Errors"
        title="Grouped failure patterns"
        detail="Errors are grouped by operational meaning so you can see whether the current problem is mostly extraction, thinking mode, embedding, or tooling."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {data.summaries.map((summary) => (
            <div key={summary.category} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{summary.category}</p>
                  <p className="mt-2 text-3xl text-[var(--fg-strong)]">{summary.count}</p>
                </div>
                <StatusBadge tone="attention">error class</StatusBadge>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{summary.sample}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Recent lines"
        title="Recent error-bearing log entries"
        detail="A compact stream of the latest non-info lines from stdout and stderr."
      >
        <div className="space-y-3">
          {data.recentEntries.map((entry, index) => (
            <div key={`${entry.source}-${index}`} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={entry.severity === "error" ? "attention" : "lagging"}>
                  {entry.source}
                </StatusBadge>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{entry.category}</p>
                {entry.timestampGuess ? (
                  <p className="text-xs text-[var(--muted)]">{entry.timestampGuess}</p>
                ) : null}
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-[family-name:var(--font-mono)] text-xs leading-6 text-[var(--muted)]">
                {entry.raw}
              </pre>
            </div>
          ))}
        </div>
      </PageSection>
    </>
  );
}
