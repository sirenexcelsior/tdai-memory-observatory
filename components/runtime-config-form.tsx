"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import type { Language } from "@/lib/i18n";

type RuntimeValueSource = "saved" | "environment" | "default";

const copy = {
  zh: {
    title: "运行时输入",
    detail: "这里可以直接指定要读取的记忆数据目录和 Gateway 地址。保存后会立即写入浏览器侧配置，并在刷新后生效。",
    dataDir: "数据目录",
    gatewayUrl: "Gateway 地址",
    dataDirHint: "建议填写绝对路径，例如 ~/.memory-tencentdb/memory-tdai",
    gatewayUrlHint: "用于健康检查与后续交互，通常是本地 Gateway 的基础地址",
    source: "当前来源",
    save: "保存并刷新",
    reset: "恢复默认值",
    saving: "保存中…",
    saved: "已保存，页面正在刷新。",
    resetDone: "已清除页面保存值，正在回退到环境变量或默认值。",
    invalid: "请输入合法的 Gateway 地址（http:// 或 https://）。",
    failed: "保存失败，请稍后重试。",
    sources: {
      saved: "页面保存",
      environment: "环境变量",
      default: "默认值",
    },
  },
  en: {
    title: "Runtime inputs",
    detail: "Set the memory data directory and gateway base URL here. Saving writes browser-scoped runtime settings and applies them on refresh.",
    dataDir: "Data directory",
    gatewayUrl: "Gateway URL",
    dataDirHint: "An absolute path is recommended, for example ~/.memory-tencentdb/memory-tdai",
    gatewayUrlHint: "Used for health checks and future interactions, usually the local gateway base URL",
    source: "Current source",
    save: "Save and refresh",
    reset: "Reset to defaults",
    saving: "Saving…",
    saved: "Saved. Refreshing the page.",
    resetDone: "Saved browser overrides cleared. Falling back to environment or defaults.",
    invalid: "Enter a valid Gateway URL using http:// or https://.",
    failed: "Could not save the runtime settings. Please try again.",
    sources: {
      saved: "Saved in browser",
      environment: "Environment variable",
      default: "Default fallback",
    },
  },
} as const;

type Props = {
  lang: Language;
  initialDataDir: string;
  initialGatewayUrl: string;
  dataDirSource: RuntimeValueSource;
  gatewayUrlSource: RuntimeValueSource;
  defaultDataDir: string;
  defaultGatewayUrl: string;
};

export function RuntimeConfigForm({
  lang,
  initialDataDir,
  initialGatewayUrl,
  dataDirSource,
  gatewayUrlSource,
  defaultDataDir,
  defaultGatewayUrl,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dataDir, setDataDir] = useState(initialDataDir);
  const [gatewayUrl, setGatewayUrl] = useState(initialGatewayUrl);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const text = copy[lang];

  const sourceText = useMemo(() => ({
    dataDir: text.sources[dataDirSource],
    gatewayUrl: text.sources[gatewayUrlSource],
  }), [dataDirSource, gatewayUrlSource, text.sources]);

  function save(nextDataDir: string, nextGatewayUrl: string, mode: "save" | "reset") {
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const response = await fetch("/api/runtime-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataDir: nextDataDir,
          gatewayUrl: nextGatewayUrl,
        }),
      });

      const payload = await response.json().catch(() => null) as { error?: string; code?: string } | null;
      if (!response.ok) {
        setError(payload?.code === "INVALID_GATEWAY_URL" ? text.invalid : (payload?.error ?? text.failed));
        return;
      }

      setNotice(mode === "reset" ? text.resetDone : text.saved);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{text.title}</p>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{text.detail}</p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-[var(--fg-strong)]">{text.dataDir}</span>
            <span className="text-xs text-[var(--muted)]">{text.source}: {sourceText.dataDir}</span>
          </div>
          <input
            value={dataDir}
            onChange={(event) => setDataDir(event.target.value)}
            placeholder={defaultDataDir}
            className="h-11 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] px-4 text-sm text-[var(--fg-strong)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--line-strong)]"
          />
          <span className="text-xs leading-5 text-[var(--muted)]">{text.dataDirHint}</span>
        </label>

        <label className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-[var(--fg-strong)]">{text.gatewayUrl}</span>
            <span className="text-xs text-[var(--muted)]">{text.source}: {sourceText.gatewayUrl}</span>
          </div>
          <input
            value={gatewayUrl}
            onChange={(event) => setGatewayUrl(event.target.value)}
            placeholder={defaultGatewayUrl}
            className="h-11 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] px-4 text-sm text-[var(--fg-strong)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--line-strong)]"
          />
          <span className="text-xs leading-5 text-[var(--muted)]">{text.gatewayUrlHint}</span>
        </label>
      </div>

      {notice ? (
        <p className="mt-4 text-sm text-emerald-200">{notice}</p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-rose-200">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => save(dataDir, gatewayUrl, "save")}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 text-sm text-[var(--fg-strong)] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? text.saving : text.save}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setDataDir(defaultDataDir);
            setGatewayUrl(defaultGatewayUrl);
            save("", "", "reset");
          }}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 text-sm text-[var(--muted)] disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" />
          {text.reset}
        </button>
      </div>
    </div>
  );
}
