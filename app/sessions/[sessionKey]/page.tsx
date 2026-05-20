import { notFound } from "next/navigation";
import { getSessionDetail } from "@/lib/tdai";
import {
  formatDateByLanguage,
  getCopy,
  translateMemoryType,
  translateRole,
  translateStatusLabel,
} from "@/lib/i18n";
import {
  DataTable,
  EmptyState,
  PageSection,
  StatusBadge,
  TableHead,
  TableRow,
} from "@/components/ui";
import { getCurrentLanguage } from "@/lib/server-language";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionKey: string }>;
}) {
  const lang = await getCurrentLanguage();
  const text = getCopy(lang);
  const { sessionKey } = await params;
  const detail = await getSessionDetail(decodeURIComponent(sessionKey), lang);

  if (!detail.session) {
    notFound();
  }

  return (
    <>
      <PageSection
        eyebrow={text.sessionDetail.eyebrow}
        title={detail.session.sessionKey}
        detail={text.sessionDetail.detail}
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{text.sessionDetail.state}</p>
            <div className="mt-3">
              <StatusBadge tone={detail.session.state}>{translateStatusLabel(lang, detail.session.state)}</StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{detail.session.stateReason}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{text.sessionDetail.l0l1}</p>
            <p className="mt-3 text-3xl text-[var(--fg-strong)]">
              {detail.session.l0Count} / {detail.session.l1Count}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">{text.sessionDetail.rawVsStructured}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{text.sessionDetail.l1Cursor}</p>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-lg text-[var(--fg-strong)]">
              {detail.checkpoint.runner?.last_l1_cursor ?? 0}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">{text.sessionDetail.consumedByL1}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{text.sessionDetail.lastScene}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--fg-strong)]">
              {detail.checkpoint.runner?.last_scene_name || text.common.noValue}
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow={text.sessionDetail.l0Eyebrow}
        title={text.sessionDetail.l0Title}
        detail={text.sessionDetail.l0Detail}
      >
        <DataTable>
          <TableHead>
            <tr>
              <th className="px-4 py-3">{text.sessionDetail.table.role}</th>
              <th className="px-4 py-3">{text.sessionDetail.table.message}</th>
              <th className="px-4 py-3">{text.sessionDetail.table.recorded}</th>
            </tr>
          </TableHead>
          <tbody>
            {detail.l0Messages.map((message) => (
              <TableRow key={message.recordId}>
                <td className="px-4 py-4 text-[var(--fg-strong)]">{translateRole(lang, message.role)}</td>
                <td className="px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                  <div className="max-w-4xl whitespace-pre-wrap">{message.text}</div>
                </td>
                <td className="px-4 py-4 text-xs text-[var(--muted)]">{formatDateByLanguage(message.recordedAt, lang, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}</td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </PageSection>

      <PageSection
        eyebrow={text.sessionDetail.l1Eyebrow}
        title={text.sessionDetail.l1Title}
        detail={text.sessionDetail.l1Detail}
      >
        {detail.l1Records.length === 0 ? (
          <EmptyState
            title={text.sessionDetail.noL1Title}
            detail={text.sessionDetail.noL1Detail}
          />
        ) : (
          <DataTable>
            <TableHead>
              <tr>
                <th className="px-4 py-3">{text.sessionDetail.table.type}</th>
                <th className="px-4 py-3">{text.sessionDetail.table.scene}</th>
                <th className="px-4 py-3">{text.sessionDetail.table.content}</th>
                <th className="px-4 py-3">{text.sessionDetail.table.created}</th>
              </tr>
            </TableHead>
            <tbody>
              {detail.l1Records.map((record) => (
                <TableRow key={record.recordId}>
                  <td className="px-4 py-4 text-[var(--fg-strong)]">{translateMemoryType(lang, record.type)}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{record.sceneName || text.common.noValue}</td>
                  <td className="px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                    <div className="max-w-4xl whitespace-pre-wrap">{record.content}</div>
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">{formatDateByLanguage(record.createdTime, lang, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}</td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        )}
      </PageSection>

      <PageSection
        eyebrow={text.sessionDetail.logsEyebrow}
        title={text.sessionDetail.logsTitle}
        detail={text.sessionDetail.logsDetail}
      >
        {detail.logs.length === 0 ? (
          <EmptyState
            title={text.sessionDetail.noLogsTitle}
            detail={text.sessionDetail.noLogsDetail}
          />
        ) : (
          <div className="space-y-3">
            {detail.logs.map((entry, index) => (
              <div key={`${entry.source}-${index}`} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
                <div className="flex items-center gap-3">
                  <StatusBadge tone={entry.severity === "error" ? "attention" : "lagging"}>
                    {entry.source === "stdout" ? text.common.stdout : text.common.stderr}
                  </StatusBadge>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{entry.category}</p>
                </div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-[family-name:var(--font-mono)] text-xs leading-6 text-[var(--muted)]">
                  {entry.raw}
                </pre>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
}
