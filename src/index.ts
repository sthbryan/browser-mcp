#!/usr/bin/env node
/**
 * browser-mcp — MCP server for Puppeteer stealth browser tools.
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
import { registerTools } from "@/tools";
import { parseCliArgs } from "@/utils/cli";

const { tools } = parseCliArgs();

const server = new McpServer({
  name: "browser-mcp",
  version: "0.1.0",
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
