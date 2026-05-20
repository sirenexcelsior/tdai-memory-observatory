import { Activity, Bot, Database, Layers3, TriangleAlert } from "lucide-react";
import { getOverviewData } from "@/lib/tdai";
import { formatDateByLanguage, getCopy, translateStatusLabel } from "@/lib/i18n";
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
import { getCurrentLanguage } from "@/lib/server-language";

export default async function Home() {
  const lang = await getCurrentLanguage();
  const text = getCopy(lang);
  const data = await getOverviewData(lang);
  const maxMix = Math.max(...data.memoryMix.map((item) => item.count), 1);

  return (
    <>
      <PageSection
        eyebrow={text.overview.eyebrow}
        title={text.overview.title}
        detail={text.overview.detail}
      >
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                  {text.overview.gateway}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <StatusBadge tone={data.health.state}>{translateStatusLabel(lang, data.health.state)}</StatusBadge>
                  <p className="text-sm text-[var(--muted)]">{data.health.details}</p>
                </div>
              </div>
              <div className="grid gap-2 text-right text-sm text-[var(--muted)]">
                <div>{text.overview.version} {data.health.version ?? text.overview.unknown}</div>
                <div>{text.overview.uptime} {data.health.uptimeSeconds ? `${Math.floor(data.health.uptimeSeconds / 60)} ${text.overview.minutes}` : text.common.noValue}</div>
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
              {text.overview.pipelinePulse}
            </p>
            <div className="mt-5 space-y-4 text-sm text-[var(--muted)]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Database className="h-4 w-4 text-[var(--accent)]" />{text.overview.trackedSessions}</span>
                <span className="text-lg text-[var(--fg-strong)]">{data.pipeline.trackedSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--accent)]" />{text.overview.activeSessions}</span>
                <span className="text-lg text-[var(--fg-strong)]">{data.pipeline.activeSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-[var(--accent)]" />{text.overview.needAttention}</span>
                <span className="text-lg text-[var(--fg-strong)]">{data.pipeline.laggingSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Bot className="h-4 w-4 text-[var(--accent)]" />{text.overview.lastPersonaWrite}</span>
                <span className="text-[var(--fg-strong)]">{formatDateByLanguage(data.pipeline.lastPersonaTime, lang, {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Layers3 className="h-4 w-4 text-[var(--accent)]" />{text.overview.scenesProcessed}</span>
                <span className="text-lg text-[var(--fg-strong)]">{data.pipeline.scenesProcessed}</span>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow={text.overview.memoryMixEyebrow}
        title={text.overview.memoryMixTitle}
        detail={text.overview.memoryMixDetail}
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
        eyebrow={text.overview.attentionEyebrow}
        title={text.overview.attentionTitle}
        detail={text.overview.attentionDetail}
      >
        <DataTable>
          <TableHead>
            <tr>
              <th className="px-4 py-3">{text.overview.table.session}</th>
              <th className="px-4 py-3">{text.overview.table.state}</th>
              <th className="px-4 py-3">L0</th>
              <th className="px-4 py-3">L1</th>
              <th className="px-4 py-3">{text.overview.table.lastActivity}</th>
              <th className="px-4 py-3">{text.overview.table.lastScene}</th>
            </tr>
          </TableHead>
          <tbody>
            {data.recentSessions.map((session) => (
              <TableRow key={session.sessionKey}>
                <td className="px-4 py-4">
                  <SessionLink sessionKey={session.sessionKey} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={session.state}>{translateStatusLabel(lang, session.state)}</StatusBadge>
                  <p className="mt-2 max-w-sm whitespace-normal break-words text-xs leading-5 text-[var(--muted)]">
                    {session.stateReason}
                  </p>
                </td>
                <td className="px-4 py-4 text-[var(--fg-strong)]">{session.l0Count}</td>
                <td className="px-4 py-4 text-[var(--fg-strong)]">{session.l1Count}</td>
                <td className="px-4 py-4 text-[var(--muted)]">{formatDateByLanguage(session.lastL0At, lang, {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</td>
                <td className="px-4 py-4 text-[var(--muted)]">
                  <div className="max-w-sm truncate">{session.lastSceneName || text.common.noValue}</div>
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </PageSection>

      <PageSection
        eyebrow={text.overview.latestSignalsEyebrow}
        title={text.overview.latestSignalsTitle}
        detail={text.overview.latestSignalsDetail}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {data.recentErrors.map((error) => (
            <div key={error.category} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{error.category}</p>
                  <p className="mt-2 text-3xl text-[var(--fg-strong)]">{error.count}</p>
                </div>
                <StatusBadge tone="attention">{text.overview.watch}</StatusBadge>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{error.sample}</p>
            </div>
          ))}
        </div>
      </PageSection>
    </>
  );
}
