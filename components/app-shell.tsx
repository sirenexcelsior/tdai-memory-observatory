"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Database,
  Gauge,
  Search,
  Settings2,
} from "lucide-react";

const navigation = [
  { href: "/", label: "Overview", icon: Gauge },
  { href: "/sessions", label: "Sessions", icon: Search },
  { href: "/errors", label: "Errors", icon: AlertTriangle },
  { href: "/config", label: "Config", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
                  TencentDB Memory
                </p>
                <h1 className="font-[family-name:var(--font-display)] text-xl text-[var(--fg-strong)]">
                  Observatory
                </h1>
              </div>
            </div>
            <p className="max-w-[18rem] text-sm leading-6 text-[var(--muted)]">
              Read-only operating console for live gateway health, session flow,
              and structured memory visibility.
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
              Observability-first MVP
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Designed for debugging, not mutation. Every page is read-only by
              default.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[var(--line)] bg-[var(--rail)]/85 px-5 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                  Local Console
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Gateway, SQLite, checkpoint, and log observability in one view.
                </p>
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                read only
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
