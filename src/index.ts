#!/usr/bin/env node
/**
 * @sthbryan/web-search-mcp — Puppeteer stealth browser MCP tools.
 *
 * Uses installed Chrome/Brave/Edge/Chromium (headless). Downloads Chrome
 * only as last resort (disable with BROWSER_MCP_ALLOW_DOWNLOAD=0).
 *
 * Tool filtering:
 *   web-search-mcp --tools=screenshot
 *   web-search-mcp --tools=screenshot,fetch_page,query
 *   web-search-mcp            # all implemented tools
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { closeBrowser } from "@/browser/manager";
import { registerTools } from "@/tools";
import { parseCliArgs } from "@/utils/cli";
import { VERSION } from "@/version";

const { tools } = parseCliArgs();

const server = new McpServer({
  name: "web-search-mcp",
  version: VERSION,
});

registerTools(server, tools);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `web-search-mcp running on stdio${tools ? ` (tools: ${tools.join(",")})` : " (all tools)"}`
);

async function shutdown() {
  await closeBrowser().catch(() => {});
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
