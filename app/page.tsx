import { Activity, Bot, Database, Layers3, TriangleAlert } from "lucide-react";
import { getOverviewData } from "@/lib/tdai";
import {
  DataTable,
  MetricTile,
  PageSection,
  SessionLink,
  StatusBadge,
  TableHead,
  TableRow,
  ToneBar,
} from "@/components/ui";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function Home() {
  const data = await getOverviewData();
  const maxMix = Math.max(...data.memoryMix.map((item) => item.count), 1);

  return (
    <>
      <PageSection
        eyebrow="Overview"
        title="TencentDB memory system status"
        detail="Start here when you need to answer a simple question quickly: is the gateway alive, are sessions flowing into L0, and is L1 actually being produced."
      >
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                  Gateway
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <StatusBadge tone={data.health.state}>{data.health.label}</StatusBadge>
                  <p className="text-sm text-[var(--muted)]">{data.health.details}</p>
                </div>
              </div>
              <div className="grid gap-2 text-right text-sm text-[var(--muted)]">
                <div>Version {data.health.version ?? "unknown"}</div>
                <div>Uptime {data.health.uptimeSeconds ? `${Math.floor(data.health.uptimeSeconds / 60)} min` : "—"}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.metrics.map((metric) => (
                <MetricTile key={metric.label} {...metric} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Pipeline pulse
            </p>
            <div className="mt-5 space-y-4 text-sm text-[var(--muted)]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Database className="h-4 w-4 text-[var(--accent)]" />Tracked sessions</span>
                <span className="text-lg text-[var(--fg-strong)]">{data.pipeline.trackedSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--accent)]" />Active sessions</span>
                <span className="text-lg text-[var(--fg-strong)]">{data.pipeline.activeSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-[var(--accent)]" />Need attention</span>
                <span className="text-lg text-[var(--fg-strong)]">{data.pipeline.laggingSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Bot className="h-4 w-4 text-[var(--accent)]" />Last persona write</span>
                <span className="text-[var(--fg-strong)]">{formatDate(data.pipeline.lastPersonaTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Layers3 className="h-4 w-4 text-[var(--accent)]" />Scenes processed</span>
                <span className="text-lg text-[var(--fg-strong)]">{data.pipeline.scenesProcessed}</span>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="Memory Mix"
        title="Structured output mix"
        detail="This is the current shape of L1. If one type suddenly dominates or vanishes, it is often the first sign that extraction or dedup behavior changed."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {data.memoryMix.map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{item.label}</p>
                  <p className="mt-2 text-3xl text-[var(--fg-strong)]">{item.count}</p>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {Math.round((item.count / Math.max(data.metrics[1] ? Number(data.metrics[1].value.replace(/,/g, "")) : item.count, 1)) * 100)}%
                </p>
              </div>
              <ToneBar tone={item.tone} value={item.count} max={maxMix} />
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Attention"
        title="Recent sessions"
        detail="Recent session flow, ordered by latest L0 activity. This is the fastest way to spot sessions that captured messages but still look behind or empty."
      >
        <DataTable>
          <TableHead>
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">L0</th>
              <th className="px-4 py-3">L1</th>
              <th className="px-4 py-3">Last activity</th>
              <th className="px-4 py-3">Last scene</th>
            </tr>
          </TableHead>
          <tbody>
            {data.recentSessions.map((session) => (
              <TableRow key={session.sessionKey}>
                <td className="px-4 py-4">
                  <SessionLink sessionKey={session.sessionKey} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={session.state}>{session.state}</StatusBadge>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--muted)]">{session.stateReason}</p>
                </td>
                <td className="px-4 py-4 text-[var(--fg-strong)]">{session.l0Count}</td>
                <td className="px-4 py-4 text-[var(--fg-strong)]">{session.l1Count}</td>
                <td className="px-4 py-4 text-[var(--muted)]">{formatDate(session.lastL0At)}</td>
                <td className="px-4 py-4 text-[var(--muted)]">
                  <div className="max-w-sm truncate">{session.lastSceneName || "—"}</div>
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </PageSection>

      <PageSection
        eyebrow="Latest Signals"
        title="Error stream"
        detail="The error list is grouped by pattern, not by stack trace. The goal is to help you answer what class of failure is happening right now."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {data.recentErrors.map((error) => (
            <div key={error.category} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{error.category}</p>
                  <p className="mt-2 text-3xl text-[var(--fg-strong)]">{error.count}</p>
                </div>
                <StatusBadge tone="attention">watch</StatusBadge>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{error.sample}</p>
            </div>
          ))}
        </div>
      </PageSection>
    </>
  );
}
