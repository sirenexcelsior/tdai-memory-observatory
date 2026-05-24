import { Bot, Cable, Command, MemoryStick, PackageCheck, TerminalSquare } from "lucide-react";
import { PageSection, StatusBadge, DataTable, TableHead, TableRow } from "@/components/ui";
import { getCurrentLanguage } from "@/lib/server-language";
import { getMcpPageData } from "@/lib/mcp";
import { translateStatusLabel, type Language } from "@/lib/i18n";

const pageCopy = {
  zh: {
    eyebrow: "MCP",
    title: "Codex 接入桥",
    detail:
      "这里展示的是这个仓库附带的本地 stdio MCP bridge。Web UI 仍然只读，但 MCP bridge 会把 Codex 的工具调用转发到你当前这台机器上的 TencentDB memory Gateway。",
    bridgeEyebrow: "桥状态",
    bridgeTitle: "本地 bridge 与目标 Gateway",
    bridgeDetail:
      "这层只做桥接，不直接读写 SQLite。所有实际记忆操作仍然走 Gateway 的现有 HTTP 接口。",
    healthDetail: {
      online: "MCP 目标 Gateway 在线，且核心存储能力可用。",
      degraded: "MCP 目标 Gateway 可访问，但至少有一层存储或服务处于降级状态。",
      offline: "MCP bridge 当前连不到目标 Gateway。",
    },
    transport: "传输",
    toolCount: "工具数",
    uiBinding: "UI 当前绑定",
    mcpTarget: "MCP 目标",
    targetSource: "目标来源",
    projectRoot: "项目根目录",
    commandsEyebrow: "启动",
    commandsTitle: "如何启动本地 MCP",
    commandsDetail:
      "推荐用 `npm run mcp` 直接启动。若你希望和 UI 使用不同的 Gateway，可以显式传 `--gateway-url`。",
    npmCommand: "项目脚本",
    directCommand: "直接命令",
    codexEyebrow: "Codex 配置",
    codexTitle: "最小 MCP 配置片段",
    codexDetail:
      "这段 TOML 配置显式绑定到当前项目里的 bridge 脚本，也显式写入 Gateway URL，所以不会依赖浏览器里的 Config 页设置。",
    toolsEyebrow: "工具",
    toolsTitle: "首批暴露给 Codex 的 Gateway 能力",
    toolsDetail:
      "先只暴露最有价值的 5 个工具：先读、再回忆、再有控制地写入，不直接碰数据库。",
    sessionEyebrow: "Session Key",
    sessionTitle: "建议的 session_key 约定",
    sessionDetail:
      "为了让记忆连续，Codex 侧最好按项目和主题稳定生成 session_key，而不是每次随机新建。",
    workflowTitle: "建议调用顺序",
    notesTitle: "边界提醒",
    notesMatch:
      "当前 UI 和 MCP 指向的是同一个 Gateway 目标，页面里的健康状态对 agent 使用也有参考意义。",
    notesMismatch:
      "当前 UI 和 MCP 指向的 Gateway 目标不同。页面里的 Config 改动只影响浏览器侧 UI，不会自动改 MCP 进程。",
    source: {
      envMcp: "环境变量 `TDAI_MCP_GATEWAY_URL`",
      envGateway: "环境变量 `TDAI_GATEWAY_URL`",
      default: "内置默认值",
    },
    mode: {
      read: "只读",
      write: "写入",
    },
    toolTable: {
      tool: "工具",
      route: "Gateway 路由",
      mode: "模式",
      purpose: "用途",
    },
    workflowSteps: [
      "1. 任务开始前先调 `tdai_health`。",
      "2. 需要历史背景时先调 `tdai_recall`。",
      "3. 一轮有价值的 user/assistant 对话结束后再调 `tdai_capture`。",
      "4. 任务或线程收尾时调 `tdai_session_end`。",
    ],
  },
  en: {
    eyebrow: "MCP",
    title: "Codex bridge",
    detail:
      "This page describes the local stdio MCP bridge that ships with this repo. The web UI stays read-only, while the bridge forwards Codex tool calls to the TencentDB memory Gateway running on this machine.",
    bridgeEyebrow: "Bridge Status",
    bridgeTitle: "Local bridge and target Gateway",
    bridgeDetail:
      "The bridge does not touch SQLite directly. Every real memory operation still goes through the existing Gateway HTTP surface.",
    healthDetail: {
      online: "The MCP target Gateway is online and its core stores look available.",
      degraded: "The MCP target Gateway is reachable, but at least one store or service looks degraded.",
      offline: "The MCP bridge cannot currently reach its target Gateway.",
    },
    transport: "Transport",
    toolCount: "Tools",
    uiBinding: "UI binding",
    mcpTarget: "MCP target",
    targetSource: "Target source",
    projectRoot: "Project root",
    commandsEyebrow: "Launch",
    commandsTitle: "How to start the local MCP",
    commandsDetail:
      "Use `npm run mcp` for the default path. If you want a different Gateway than the UI uses, pass `--gateway-url` explicitly.",
    npmCommand: "Project script",
    directCommand: "Direct command",
    codexEyebrow: "Codex Config",
    codexTitle: "Minimal MCP config snippet",
    codexDetail:
      "This TOML snippet points Codex at the bridge inside this repo and pins the Gateway URL explicitly, so it does not depend on browser-side Config page overrides.",
    toolsEyebrow: "Tools",
    toolsTitle: "First Gateway capabilities exposed to Codex",
    toolsDetail:
      "The first cut is intentionally small: read, recall, then controlled writes through the Gateway rather than direct database edits.",
    sessionEyebrow: "Session Key",
    sessionTitle: "Recommended session_key convention",
    sessionDetail:
      "For continuity, Codex should generate stable session keys by project and topic instead of creating a new random key each time.",
    workflowTitle: "Suggested call order",
    notesTitle: "Boundary note",
    notesMatch:
      "The UI and MCP bridge currently point at the same Gateway target, so the page health signal is meaningful for both.",
    notesMismatch:
      "The UI and MCP bridge currently point at different Gateway targets. Config page overrides only affect the browser-side UI and do not reconfigure the MCP process.",
    source: {
      envMcp: "Environment variable `TDAI_MCP_GATEWAY_URL`",
      envGateway: "Environment variable `TDAI_GATEWAY_URL`",
      default: "Built-in default",
    },
    mode: {
      read: "read",
      write: "write",
    },
    toolTable: {
      tool: "Tool",
      route: "Gateway route",
      mode: "Mode",
      purpose: "Purpose",
    },
    workflowSteps: [
      "1. Call `tdai_health` before a substantial task starts.",
      "2. Call `tdai_recall` when the answer depends on prior project or user context.",
      "3. Call `tdai_capture` after a useful user/assistant turn completes.",
      "4. Call `tdai_session_end` when the task or thread is wrapping up.",
    ],
  },
} satisfies Record<Language, unknown>;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-[var(--line)] bg-black/20 px-4 py-4 text-xs leading-6 text-[var(--fg-strong)]">
      <code>{children}</code>
    </pre>
  );
}

export default async function McpPage() {
  const lang = await getCurrentLanguage();
  const text = pageCopy[lang];
  const data = await getMcpPageData();

  const mcpSourceLabel =
    data.mcpGatewaySource === "env_mcp"
      ? text.source.envMcp
      : data.mcpGatewaySource === "env_gateway"
        ? text.source.envGateway
        : text.source.default;
  const healthDetail = text.healthDetail[data.bridgeHealth.state];

  return (
    <>
      <PageSection eyebrow={text.eyebrow} title={text.title} detail={text.detail}>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                  {text.bridgeEyebrow}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <StatusBadge tone={data.bridgeHealth.state}>
                    {translateStatusLabel(lang, data.bridgeHealth.state)}
                  </StatusBadge>
                  <p className="text-sm text-[var(--muted)]">{healthDetail}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                <PackageCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
                {data.bridgeHealth.version ?? "0.1.0"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-[var(--line)] bg-black/10 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{text.transport}</p>
                <p className="mt-3 text-2xl text-[var(--fg-strong)]">{data.transport}</p>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-black/10 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{text.toolCount}</p>
                <p className="mt-3 text-2xl text-[var(--fg-strong)]">{data.tools.length}</p>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-black/10 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{text.targetSource}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--fg-strong)]">{mcpSourceLabel}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
              <div className="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-black/10 px-4 py-4 md:flex-row md:items-start md:justify-between">
                <div className="inline-flex items-center gap-2 text-[var(--fg)]">
                  <Cable className="h-4 w-4 text-[var(--accent)]" />
                  {text.mcpTarget}
                </div>
                <code className="break-all text-xs text-[var(--fg-strong)]">{data.mcpGatewayUrl}</code>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-black/10 px-4 py-4 md:flex-row md:items-start md:justify-between">
                <div className="inline-flex items-center gap-2 text-[var(--fg)]">
                  <Bot className="h-4 w-4 text-[var(--accent)]" />
                  {text.uiBinding}
                </div>
                <code className="break-all text-xs text-[var(--fg-strong)]">{data.uiGatewayUrl}</code>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-black/10 px-4 py-4 md:flex-row md:items-start md:justify-between">
                <div className="inline-flex items-center gap-2 text-[var(--fg)]">
                  <MemoryStick className="h-4 w-4 text-[var(--accent)]" />
                  {text.projectRoot}
                </div>
                <code className="break-all text-xs text-[var(--fg-strong)]">{data.projectRoot}</code>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
              {text.notesTitle}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              {data.gatewayMatch ? text.notesMatch : text.notesMismatch}
            </p>
            <div className="mt-6 rounded-lg border border-[var(--line)] bg-black/10 px-4 py-4">
              <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--fg-strong)]">
                {text.bridgeTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {text.bridgeDetail}
              </p>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection eyebrow={text.commandsEyebrow} title={text.commandsTitle} detail={text.commandsDetail}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--fg)]">
              <Command className="h-4 w-4 text-[var(--accent)]" />
              {text.npmCommand}
            </div>
            <CodeBlock>{data.npmCommand}</CodeBlock>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--fg)]">
              <TerminalSquare className="h-4 w-4 text-[var(--accent)]" />
              {text.directCommand}
            </div>
            <CodeBlock>{data.directCommand}</CodeBlock>
          </div>
        </div>
      </PageSection>

      <PageSection eyebrow={text.codexEyebrow} title={text.codexTitle} detail={text.codexDetail}>
        <CodeBlock>{data.codexConfigSnippet}</CodeBlock>
      </PageSection>

      <PageSection eyebrow={text.toolsEyebrow} title={text.toolsTitle} detail={text.toolsDetail}>
        <DataTable>
          <TableHead>
            <tr>
              <th className="px-4 py-3">{text.toolTable.tool}</th>
              <th className="px-4 py-3">{text.toolTable.route}</th>
              <th className="px-4 py-3">{text.toolTable.mode}</th>
              <th className="px-4 py-3">{text.toolTable.purpose}</th>
            </tr>
          </TableHead>
          <tbody>
            {data.tools.map((tool) => (
              <TableRow key={tool.name}>
                <td className="px-4 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--fg-strong)]">
                  {tool.name}
                </td>
                <td className="px-4 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                  {tool.route}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={tool.mode === "read" ? "healthy" : "lagging"}>
                    {tool.mode === "read" ? text.mode.read : text.mode.write}
                  </StatusBadge>
                </td>
                <td className="px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                  {tool.purpose[lang]}
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </PageSection>

      <PageSection eyebrow={text.sessionEyebrow} title={text.sessionTitle} detail={text.sessionDetail}>
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
              session_key
            </p>
            <div className="mt-4 space-y-3">
              {data.sessionKeyExamples.map((example) => (
                <code
                  key={example}
                  className="block rounded-lg border border-[var(--line)] bg-black/10 px-3 py-3 text-xs text-[var(--fg-strong)]"
                >
                  {example}
                </code>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{text.workflowTitle}</p>
            <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--muted)]">
              {text.workflowSteps.map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
}
