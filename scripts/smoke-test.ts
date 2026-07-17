#!/usr/bin/env bun
/**
 * Smoke test: boots the MCP server, lists tools, calls each implemented one.
 *
 * Usage:
 *   bun run scripts/smoke-test.ts
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

function call(
  proc: ReturnType<typeof spawn>,
  method: string,
  params?: unknown,
  id = 1
): Promise<JsonRpcResponse> {
  const req = {
    jsonrpc: "2.0" as const,
    id,
    method,
    ...(params ? { params } : {}),
  };
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) {
          newline = buffer.indexOf("\n");
          continue;
        }
        try {
          const msg = JSON.parse(line) as JsonRpcResponse;
          if (msg.id === id) {
            proc.stdout?.off("data", onData);
            resolve(msg);
            return;
          }
        } catch {
          // ignore non-json
        }
        newline = buffer.indexOf("\n");
      }
    };
    proc.stdout?.on("data", onData);
    proc.stdin?.write(`${JSON.stringify(req)}\n`);
    setTimeout(() => {
      proc.stdout?.off("data", onData);
      reject(new Error(`timeout waiting for ${method}`));
    }, 90_000);
  });
}

const cwd = fileURLToPath(new URL("..", import.meta.url));
const proc = spawn("bun", ["run", "src/index.ts"], {
  cwd,
  stdio: ["pipe", "pipe", "pipe"],
});

proc.stderr?.on("data", (c) => {
  process.stderr.write(c);
});

try {
  await call(
    proc,
    "initialize",
    {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "smoke", version: "0.0.0" },
    },
    1
  );

  proc.stdin?.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);

  const list = await call(proc, "tools/list", undefined, 2);
  const tools = (list.result as { tools: Array<{ name: string }> }).tools;
  const names = tools.map((t) => t.name).sort();
  console.log(`✓ listed tools: ${names.join(", ")}`);
  for (const need of ["screenshot", "fetch_page", "search"]) {
    if (!names.includes(need)) throw new Error(`missing tool: ${need}`);
  }

  const shot = await call(
    proc,
    "tools/call",
    {
      name: "screenshot",
      arguments: { url: "https://example.com", template: "mobile", format: "png" },
    },
    3
  );
  if (shot.error) throw new Error(`screenshot: ${shot.error.message}`);
  const shotContent = (shot.result as { content: Array<{ type: string }> }).content;
  if (!shotContent.some((c) => c.type === "image")) throw new Error("screenshot: no image");
  console.log("✓ screenshot");

  const fetch = await call(
    proc,
    "tools/call",
    {
      name: "fetch_page",
      arguments: { url: "https://example.com", type: "text" },
    },
    4
  );
  if (fetch.error) throw new Error(`fetch_page: ${fetch.error.message}`);
  const fetchText = JSON.stringify(fetch.result);
  if (!fetchText.includes("Example Domain") && !fetchText.includes("example")) {
    console.error(fetchText.slice(0, 400));
    throw new Error("fetch_page: unexpected body");
  }
  console.log(`✓ fetch_page (${fetchText.length} bytes)`);

  const search = await call(
    proc,
    "tools/call",
    {
      name: "search",
      arguments: { query: "TypeScript language", limit: 3 },
    },
    5
  );
  if (search.error) throw new Error(`search: ${search.error.message}`);
  const searchPayload = search.result as {
    content: Array<{ type: string; text?: string }>;
  };
  const searchBody = searchPayload.content.find((c) => c.type === "text")?.text ?? "";
  const parsed = JSON.parse(searchBody) as {
    results?: unknown[];
    error?: string;
    engine?: string;
  };
  if (parsed.error) throw new Error(`search: ${parsed.error}`);
  if (!Array.isArray(parsed.results)) throw new Error("search: no results array");
  if (parsed.results.length === 0) {
    throw new Error("search: zero results (engines blocked or markup changed)");
  }
  console.log(`✓ search (${parsed.results.length} via ${parsed.engine ?? "?"})`);

  console.log("✓ smoke ok");
  proc.kill();
  process.exit(0);
} catch (e) {
  console.error("✗ smoke failed:", e);
  proc.kill();
  process.exit(1);
}
