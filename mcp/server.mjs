#!/usr/bin/env node

import process from "node:process";

const SERVER_NAME = "tdai-memory-observatory-mcp";
const SERVER_VERSION = "0.1.0";
const DEFAULT_GATEWAY_URL = "http://127.0.0.1:8420";

const TOOL_DEFINITIONS = [
  {
    name: "tdai_health",
    title: "TDAI Health",
    description: "Check whether the local TencentDB Agent Memory Gateway is online.",
    route: "GET /health",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "tdai_recall",
    title: "TDAI Recall",
    description: "Recall structured memory context for a stable session key before answering.",
    route: "POST /recall",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Current user intent or task query." },
        session_key: { type: "string", description: "Stable session key used by the memory system." },
        user_id: { type: "string", description: "Optional user identifier." },
      },
      required: ["query", "session_key"],
      additionalProperties: false,
    },
  },
  {
    name: "tdai_capture",
    title: "TDAI Capture",
    description: "Write one completed user/assistant turn into L0 and notify the scheduler.",
    route: "POST /capture",
    readOnly: false,
    inputSchema: {
      type: "object",
      properties: {
        session_key: { type: "string", description: "Stable session key used by the memory system." },
        user_content: { type: "string", description: "User-side content for the committed turn." },
        assistant_content: { type: "string", description: "Assistant-side content for the committed turn." },
        session_id: { type: "string", description: "Optional host session id." },
        user_id: { type: "string", description: "Optional user identifier." },
      },
      required: ["session_key", "user_content", "assistant_content"],
      additionalProperties: false,
    },
  },
  {
    name: "tdai_search_memories",
    title: "TDAI Search Memories",
    description: "Search L1 memories directly for debugging or explicit inspection.",
    route: "POST /search/memories",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query." },
        limit: { type: "number", description: "Maximum number of results to return." },
        type: { type: "string", description: "Optional memory type filter." },
        scene: { type: "string", description: "Optional scene filter." },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "tdai_session_end",
    title: "TDAI Session End",
    description: "Flush a session after a task is complete so buffered work can settle.",
    route: "POST /session/end",
    readOnly: false,
    inputSchema: {
      type: "object",
      properties: {
        session_key: { type: "string", description: "Stable session key used by the memory system." },
        user_id: { type: "string", description: "Optional user identifier." },
      },
      required: ["session_key"],
      additionalProperties: false,
    },
  },
];

function printHelpAndExit() {
  process.stdout.write(
    [
      `${SERVER_NAME} ${SERVER_VERSION}`,
      "",
      "Usage:",
      "  node ./mcp/server.mjs [--gateway-url http://127.0.0.1:8420]",
      "",
      "Resolution order for the target Gateway:",
      "  1. --gateway-url",
      "  2. TDAI_MCP_GATEWAY_URL",
      "  3. TDAI_GATEWAY_URL",
      `  4. ${DEFAULT_GATEWAY_URL}`,
      "",
    ].join("\n"),
  );
  process.exit(0);
}

function normalizeGatewayUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) return null;
    const normalizedPath = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
    return `${url.origin}${normalizedPath}`;
  } catch {
    return null;
  }
}

function parseGatewayUrl(argv) {
  let cliGatewayUrl = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    }
    if (arg === "--gateway-url") {
      cliGatewayUrl = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return normalizeGatewayUrl(cliGatewayUrl)
    ?? normalizeGatewayUrl(process.env.TDAI_MCP_GATEWAY_URL)
    ?? normalizeGatewayUrl(process.env.TDAI_GATEWAY_URL)
    ?? DEFAULT_GATEWAY_URL;
}

const gatewayUrl = parseGatewayUrl(process.argv.slice(2));

if (!gatewayUrl) {
  process.stderr.write("Invalid gateway URL.\n");
  process.exit(1);
}

async function callGateway(method, route, body) {
  const response = await fetch(`${gatewayUrl}${route}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });

  const rawText = await response.text();
  let parsed;

  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    parsed = { raw: rawText };
  }

  if (!response.ok) {
    const message =
      (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : rawText) || `${method} ${route} failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = parsed;
    throw error;
  }

  return parsed;
}

async function runTool(name, args) {
  switch (name) {
    case "tdai_health":
      return callGateway("GET", "/health");
    case "tdai_recall":
      return callGateway("POST", "/recall", args);
    case "tdai_capture":
      return callGateway("POST", "/capture", args);
    case "tdai_search_memories":
      return callGateway("POST", "/search/memories", args);
    case "tdai_session_end":
      return callGateway("POST", "/session/end", args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function makeToolList() {
  return TOOL_DEFINITIONS.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: {
      readOnlyHint: tool.readOnly,
    },
  }));
}

function writeMessage(message) {
  const json = JSON.stringify(message);
  const payload =
    transportMode === "jsonl"
      ? `${json}\n`
      : `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
  process.stdout.write(payload);
}

function writeResponse(id, result) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    result,
  });
}

function writeError(id, code, message, data) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  });
}

async function handleToolCall(id, params) {
  const name = params?.name;
  const args = params?.arguments ?? {};

  const tool = TOOL_DEFINITIONS.find((item) => item.name === name);
  if (!tool) {
    writeError(id, -32602, `Unknown tool: ${String(name)}`);
    return;
  }

  try {
    const result = await runTool(name, args);
    writeResponse(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
      structuredContent: result,
      isError: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeResponse(id, {
      content: [
        {
          type: "text",
          text: `Tool call failed: ${message}`,
        },
      ],
      structuredContent: {
        error: message,
        gateway_url: gatewayUrl,
      },
      isError: true,
    });
  }
}

async function handleRequest(message) {
  const { id, method, params } = message;

  switch (method) {
    case "initialize": {
      const requestedVersion = params?.protocolVersion;
      const protocolVersion =
        requestedVersion === "2024-11-05"
        || requestedVersion === "2025-03-26"
        || requestedVersion === "2025-06-18"
          ? requestedVersion
          : "2025-03-26";

      writeResponse(id, {
        protocolVersion,
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
      });
      return;
    }

    case "notifications/initialized":
    case "notifications/cancelled":
      return;

    case "ping":
      writeResponse(id, {});
      return;

    case "resources/list":
      writeResponse(id, {
        resources: [],
      });
      return;

    case "resources/templates/list":
      writeResponse(id, {
        resourceTemplates: [],
      });
      return;

    case "prompts/list":
      writeResponse(id, {
        prompts: [],
      });
      return;

    case "logging/setLevel":
      writeResponse(id, {});
      return;

    case "tools/list":
      writeResponse(id, {
        tools: makeToolList(),
      });
      return;

    case "tools/call":
      await handleToolCall(id, params);
      return;

    default:
      if (id !== undefined) {
        writeError(id, -32601, `Method not found: ${method}`);
      }
  }
}

let buffer = Buffer.alloc(0);
let transportMode = "framed";

function consumeJsonLineMessage() {
  const newlineIndex = buffer.indexOf("\n");
  if (newlineIndex === -1) return null;

  const line = buffer.slice(0, newlineIndex).toString("utf8").trim();
  buffer = buffer.slice(newlineIndex + 1);
  if (!line) return null;

  transportMode = "jsonl";
  return line;
}

function consumeFramedMessage() {
  let separatorLength = 4;
  let headerEnd = buffer.indexOf("\r\n\r\n");

  if (headerEnd === -1) {
    headerEnd = buffer.indexOf("\n\n");
    separatorLength = 2;
  }

  if (headerEnd === -1) return null;

  const headerText = buffer.slice(0, headerEnd).toString("utf8");
  const contentLengthMatch = headerText.match(/Content-Length:\s*(\d+)/i);
  if (!contentLengthMatch) {
    process.stderr.write("Missing Content-Length header.\n");
    buffer = Buffer.alloc(0);
    return null;
  }

  const contentLength = Number(contentLengthMatch[1]);
  const messageEnd = headerEnd + separatorLength + contentLength;
  if (buffer.length < messageEnd) return null;

  const bodyText = buffer.slice(headerEnd + separatorLength, messageEnd).toString("utf8");
  buffer = buffer.slice(messageEnd);
  transportMode = "framed";
  return bodyText;
}

function processBuffer() {
  while (true) {
    const trimmed = buffer.toString("utf8").trimStart();
    const bodyText = trimmed.startsWith("{")
      ? consumeJsonLineMessage()
      : consumeFramedMessage();

    if (!bodyText) return;

    let message;
    try {
      message = JSON.parse(bodyText);
    } catch (error) {
      writeError(null, -32700, "Parse error", {
        detail: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    handleRequest(message).catch((error) => {
      const messageText = error instanceof Error ? error.message : String(error);
      if (message?.id !== undefined) {
        writeError(message.id, -32000, messageText);
      } else {
        process.stderr.write(`${messageText}\n`);
      }
    });
  }
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  processBuffer();
});

process.stdin.on("end", () => {
  process.exit(0);
});

process.stdin.resume();
