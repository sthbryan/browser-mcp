import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchInputSchema } from "@/schemas/fetch";
import { queryInputSchema } from "@/schemas/query";
import { screenshotInputSchema } from "@/schemas/screenshot";
import { searchInputSchema } from "@/schemas/search";
import { createFetchHandler } from "@/tools/fetch";
import { createQueryHandler } from "@/tools/query";
import { createScreenshotHandler } from "@/tools/screenshot";
import { createSearchHandler } from "@/tools/search";
import type { ToolName } from "@/utils/cli";

const implementedTools = new Set<ToolName>(["screenshot", "fetch_page", "query", "search"]);

/**
 * Register MCP tools. When `enabled` is null/undefined, all implemented tools register.
 * When set (from --tools=...), only those names are registered.
 */
export function registerTools(server: McpServer, enabled?: ToolName[] | null): void {
  const requested = enabled?.length ? enabled : [...implementedTools];
  const set = new Set<ToolName>(requested);

  if (enabled?.length) {
    const unimplemented = requested.filter((t) => !implementedTools.has(t));
    if (unimplemented.length > 0) {
      console.error(
        `browser-mcp: tool(s) not implemented yet (skipped): ${unimplemented.join(", ")}`
      );
    }
  }

  if (set.has("screenshot") && implementedTools.has("screenshot")) {
    server.registerTool(
      "screenshot",
      {
        title: "Screenshot",
        description:
          "Capture a screenshot of a URL with device templates (mobile, tablet, desktop) or custom viewport size. Returns an image plus metadata.",
        inputSchema: screenshotInputSchema,
      },
      createScreenshotHandler()
    );
  }

  if (set.has("fetch_page") && implementedTools.has("fetch_page")) {
    server.registerTool(
      "fetch_page",
      {
        title: "Fetch Page",
        description:
          "Fetch a URL in a real browser (JS rendered) and return html, markdown, or text.",
        inputSchema: fetchInputSchema,
      },
      createFetchHandler()
    );
  }

  if (set.has("query") && implementedTools.has("query")) {
    server.registerTool(
      "query",
      {
        title: "Query",
        description:
          "Extract specific data from a JS-rendered page using CSS selectors and/or text filters. Optionally read HTML attributes (href, src, ...).",
        inputSchema: queryInputSchema,
      },
      createQueryHandler()
    );
  }

  if (set.has("search") && implementedTools.has("search")) {
    server.registerTool(
      "search",
      {
        title: "Search",
        description:
          "Search the web via Puppeteer stealth (DuckDuckGo Lite → HTML → Brave). Returns titles and URLs.",
        inputSchema: searchInputSchema,
      },
      createSearchHandler()
    );
  }
}

export function listImplementedTools(): ToolName[] {
  return [...implementedTools];
}
