"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bot,
  Database,
  Gauge,
  Search,
  Settings2,
} from "lucide-react";
import { getCopy, type Language } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";

export function AppShell({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: Language;
}) {
  const pathname = usePathname();
  const text = getCopy(lang);
  const navigation = [
    { href: "/", label: text.shell.navOverview, icon: Gauge },
    { href: "/sessions", label: text.shell.navSessions, icon: Search },
    { href: "/errors", label: text.shell.navErrors, icon: AlertTriangle },
    { href: "/mcp", label: "MCP", icon: Bot },
    { href: "/config", label: text.shell.navConfig, icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 flex-col border-r border-[var(--line)] bg-[var(--rail)] px-6 py-7 lg:flex">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-black/25 text-[var(--accent)]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                  {text.shell.sidebarTag}
                </p>
                <h1 className="font-[family-name:var(--font-display)] text-xl text-[var(--fg-strong)]">
                  {text.shell.sidebarTitle}
                </h1>
              </div>
            </div>
            <p className="max-w-[18rem] text-sm leading-6 text-[var(--muted)]">
              {text.shell.sidebarDetail}
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-[var(--panel-strong)] text-[var(--fg-strong)]"
                      : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--fg)]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-[var(--fg)]">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
              {text.shell.footerTitle}
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              {text.shell.footerDetail}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[var(--line)] bg-[var(--rail)]/85 px-5 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                  {text.shell.headerEyebrow}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {text.shell.headerDetail}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LanguageToggle current={lang} />
                <div className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                  {text.shell.readOnly}
                </div>
              </div>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm",
                      active
                        ? "border-[var(--line-strong)] bg-[var(--panel-strong)] text-[var(--fg-strong)]"
                        : "border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
