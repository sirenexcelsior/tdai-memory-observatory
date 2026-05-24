import "server-only";

import path from "node:path";
import { DEFAULT_GATEWAY_URL, getRuntimeConfig, normalizeGatewayUrlInput } from "@/lib/runtime-config";

export type McpToolSummary = {
  name: string;
  route: string;
  mode: "read" | "write";
  purpose: {
    zh: string;
    en: string;
  };
};

export type McpPageData = {
  transport: "stdio";
  uiGatewayUrl: string;
  mcpGatewayUrl: string;
  mcpGatewaySource: "env_mcp" | "env_gateway" | "default";
  gatewayMatch: boolean;
  bridgeHealth: {
    state: "online" | "degraded" | "offline";
    details: string;
    version: string | null;
  };
  projectRoot: string;
  serverPath: string;
  npmCommand: string;
  directCommand: string;
  codexConfigSnippet: string;
  tools: McpToolSummary[];
  sessionKeyExamples: string[];
};

function getMcpGatewayConfig() {
  const fromDedicatedEnv = normalizeGatewayUrlInput(process.env.TDAI_MCP_GATEWAY_URL);
  if (fromDedicatedEnv) {
    return {
      gatewayUrl: fromDedicatedEnv,
      source: "env_mcp" as const,
    };
  }

  const fromSharedEnv = normalizeGatewayUrlInput(process.env.TDAI_GATEWAY_URL);
  if (fromSharedEnv) {
    return {
      gatewayUrl: fromSharedEnv,
      source: "env_gateway" as const,
    };
  }

  return {
    gatewayUrl: DEFAULT_GATEWAY_URL,
    source: "default" as const,
  };
}

async function readGatewayHealth(gatewayUrl: string) {
  try {
    const response = await fetch(`${gatewayUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return {
        state: "offline" as const,
        details: `HTTP ${response.status}`,
        version: null,
      };
    }

    const payload = await response.json() as {
      status?: "ok" | "degraded";
      version?: string;
      stores?: { vectorStore?: boolean; embeddingService?: boolean };
    };

    return {
      state: payload.status === "degraded" ? "degraded" as const : "online" as const,
      details:
        payload.stores?.vectorStore && payload.stores?.embeddingService
          ? "Vector store and embedding service available"
          : "Gateway is reachable but one or more stores look degraded",
      version: payload.version ?? null,
    };
  } catch {
    return {
      state: "offline" as const,
      details: "Gateway not reachable from MCP bridge",
      version: null,
    };
  }
}

export async function getMcpPageData(): Promise<McpPageData> {
  const runtime = await getRuntimeConfig();
  const mcp = getMcpGatewayConfig();
  const bridgeHealth = await readGatewayHealth(mcp.gatewayUrl);
  const projectRoot = process.cwd();
  const serverPath = path.join(projectRoot, "mcp", "server.mjs");

  const tools: McpToolSummary[] = [
    {
      name: "tdai_health",
      route: "GET /health",
      mode: "read",
      purpose: {
        zh: "检查本地 Gateway 是否在线。",
        en: "Check whether the local Gateway is online.",
      },
    },
    {
      name: "tdai_recall",
      route: "POST /recall",
      mode: "read",
      purpose: {
        zh: "在回答前按稳定 session_key 召回结构化记忆。",
        en: "Recall structured memory for a stable session key before answering.",
      },
    },
    {
      name: "tdai_capture",
      route: "POST /capture",
      mode: "write",
      purpose: {
        zh: "把一轮 user/assistant 对话写入 L0 并通知调度器。",
        en: "Write one completed user/assistant turn into L0 and notify the scheduler.",
      },
    },
    {
      name: "tdai_search_memories",
      route: "POST /search/memories",
      mode: "read",
      purpose: {
        zh: "直接搜索 L1 记忆，适合显式排查和核对。",
        en: "Search L1 memories directly for explicit inspection and debugging.",
      },
    },
    {
      name: "tdai_session_end",
      route: "POST /session/end",
      mode: "write",
      purpose: {
        zh: "在任务结束时 flush 当前 session。",
        en: "Flush the current session when a task is complete.",
      },
    },
  ];

  const codexConfigSnippet = `[mcp_servers.tdai_memory]\ncommand = "/opt/homebrew/bin/node"\nargs = ["${serverPath}", "--gateway-url", "${mcp.gatewayUrl}"]\nstartup_timeout_sec = 120\nenabled = true\n\n[mcp_servers.tdai_memory.env]\nTDAI_MCP_GATEWAY_URL = "${mcp.gatewayUrl}"`;

  return {
    transport: "stdio",
    uiGatewayUrl: runtime.gatewayUrl,
    mcpGatewayUrl: mcp.gatewayUrl,
    mcpGatewaySource: mcp.source,
    gatewayMatch: runtime.gatewayUrl === mcp.gatewayUrl,
    bridgeHealth,
    projectRoot,
    serverPath,
    npmCommand: "npm run mcp",
    directCommand: `node ${serverPath} --gateway-url ${mcp.gatewayUrl}`,
    codexConfigSnippet,
    tools,
    sessionKeyExamples: [
      "codex:TencentDB-Agent-Memory:mcp-design",
      "codex:TencentDB-Agent-Memory:gateway-debug",
      "codex:tdai-memory-observatory:ui-polish",
    ],
  };
}
