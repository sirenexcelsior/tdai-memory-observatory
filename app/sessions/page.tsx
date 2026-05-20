import { getSessions } from "@/lib/tdai";
import { formatDateByLanguage, getCopy, translateStatusLabel } from "@/lib/i18n";
import {
  DataTable,
  EmptyState,
  PageSection,
  SessionLink,
  StatusBadge,
  TableHead,
  TableRow,
} from "@/components/ui";
import { getCurrentLanguage } from "@/lib/server-language";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const lang = await getCurrentLanguage();
  const text = getCopy(lang);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const sessions = await getSessions(query, lang);

  return (
    <PageSection
      eyebrow={text.sessions.eyebrow}
      title={text.sessions.title}
      detail={text.sessions.detail}
    >
      <form action="/sessions" className="mb-5 flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={text.sessions.searchPlaceholder}
          className="h-11 flex-1 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 text-sm text-[var(--fg-strong)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--line-strong)]"
        />
        <button
          type="submit"
          className="h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 text-sm text-[var(--fg-strong)]"
        >
          {text.sessions.filter}
        </button>
      </form>

      {sessions.length === 0 ? (
        <EmptyState
          title={text.sessions.emptyTitle}
          detail={text.sessions.emptyDetail}
        />
      ) : (
        <DataTable>
          <TableHead>
            <tr>
              <th className="px-4 py-3">{text.sessions.table.session}</th>
              <th className="px-4 py-3">{text.sessions.table.state}</th>
              <th className="px-4 py-3">L0</th>
              <th className="px-4 py-3">L1</th>
              <th className="px-4 py-3">{text.sessions.table.cursor}</th>
              <th className="px-4 py-3">{text.sessions.table.lastL0}</th>
              <th className="px-4 py-3">{text.sessions.table.lastScene}</th>
            </tr>
          </TableHead>
          <tbody>
            {sessions.map((session) => (
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
                <td className="px-4 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                  {session.lastCursorMs || 0}
                </td>
                <td className="px-4 py-4 text-[var(--muted)]">{formatDateByLanguage(session.lastL0At, lang, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</td>
                <td className="px-4 py-4 text-[var(--muted)]">
                  <div className="max-w-md truncate">{session.lastSceneName || text.common.noValue}</div>
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      )}
    </PageSection>
  );
}
