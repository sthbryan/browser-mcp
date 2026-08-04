#!/usr/bin/env node
/**
 * @sthbryan/browser-mcp — Puppeteer stealth browser MCP tools.
 *
 * Uses installed Chrome/Brave/Edge/Chromium (headless). Downloads Chrome
 * only as last resort (disable with BROWSER_MCP_ALLOW_DOWNLOAD=0).
 *
 * Tool filtering:
 *   browser-mcp --tools=screenshot
 *   browser-mcp --tools=screenshot,fetch_page,query
 *   browser-mcp            # all implemented tools
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { closeBrowser } from "@/browser/manager";
import { applyRuntimeConfig } from "@/config";
import { registerTools } from "@/tools";
import { parseCliArgs } from "@/utils/cli";
import { VERSION } from "@/version";

const { tools, allowDownload, allowPrivate } = parseCliArgs();

const overrides: { allowDownload?: boolean; allowPrivate?: boolean } = {};
if (allowDownload !== null) overrides.allowDownload = allowDownload;
if (allowPrivate !== null) overrides.allowPrivate = allowPrivate;
if (Object.keys(overrides).length > 0) applyRuntimeConfig(overrides);

const server = new McpServer({
  name: "browser-mcp",
  version: VERSION,
});

registerTools(server, tools);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `browser-mcp running on stdio${tools ? ` (tools: ${tools.join(",")})` : " (all tools)"}`
);

async function shutdown() {
  await closeBrowser().catch(() => {});
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
