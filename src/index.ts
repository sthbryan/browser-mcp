#!/usr/bin/env node
/**
 * browser-mcp — MCP server for Playwright/Chromium browser tools.
 *
 * No native-fetch fallback. Requires Playwright Chromium
 * (or BROWSER_MCP_CHANNEL / BROWSER_MCP_EXECUTABLE_PATH).
 *
 * Tool filtering:
 *   browser-mcp --tools=screenshot
 *   browser-mcp --tools=screenshot,fetch_page
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
