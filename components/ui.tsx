import Link from "next/link";

export function PageSection({
  eyebrow,
  title,
  detail,
  children,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--line)] px-5 py-7 lg:px-8">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--fg-strong)]">
            {title}
          </h2>
        </div>
        {detail ? <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{detail}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl text-[var(--fg-strong)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{hint}</p>
    </div>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "healthy" | "attention" | "lagging" | "empty" | "online" | "degraded" | "offline";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "healthy" || tone === "online"
      ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-200"
      : tone === "degraded" || tone === "lagging"
        ? "border-amber-500/25 bg-amber-500/12 text-amber-100"
        : tone === "offline" || tone === "attention"
          ? "border-rose-500/25 bg-rose-500/12 text-rose-100"
          : "border-white/10 bg-white/5 text-[var(--muted)]";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${toneClass}`}>
      {children}
    </span>
  );
}

export function DataTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)]">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-black/10 text-left text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
      {children}
    </thead>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-t border-[var(--line)] align-top">{children}</tr>;
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--line-strong)] px-5 py-10 text-center">
      <p className="font-[family-name:var(--font-display)] text-xl text-[var(--fg-strong)]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

export function SessionLink({ sessionKey }: { sessionKey: string }) {
  return (
    <Link
      href={`/sessions/${encodeURIComponent(sessionKey)}`}
      className="font-medium text-[var(--fg-strong)] underline-offset-4 hover:underline"
    >
      {sessionKey}
    </Link>
  );
}

export function ToneBar({
  value,
  max,
  tone,
}: {
  value: number;
  max: number;
  tone: "teal" | "amber" | "violet" | "slate";
}) {
  const toneClass =
    tone === "teal"
      ? "bg-teal-300"
      : tone === "amber"
        ? "bg-amber-300"
        : tone === "violet"
          ? "bg-violet-300"
          : "bg-slate-300";

  const width = max > 0 ? Math.max(10, (value / max) * 100) : 0;
  return (
    <div className="mt-3 h-2 rounded-full bg-black/15">
      <div className={`h-2 rounded-full ${toneClass}`} style={{ width: `${width}%` }} />
    </div>
  );
}
