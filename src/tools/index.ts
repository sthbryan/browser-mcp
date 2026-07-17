import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { screenshotInputSchema } from "@/schemas/screenshot";
import { createScreenshotHandler } from "@/tools/screenshot";
import type { ToolName } from "@/utils/cli";
import { ALL_TOOLS } from "@/utils/cli";

/**
 * Register MCP tools. When `enabled` is null/undefined, all known tools register.
 * When set (from --tools=...), only those names are registered.
 *
 * Planned but not yet implemented: fetch_page, query, search (browser-backed).
 */
export function registerTools(server: McpServer, enabled?: ToolName[] | null): void {
  const set = new Set<ToolName>(enabled?.length ? enabled : ALL_TOOLS);

  if (set.has("screenshot")) {
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

  // Stubs intentionally not registered until implemented.
  // Agents only see tools that work. Use --tools to limit surface further.
  if (set.has("fetch_page") || set.has("query") || set.has("search")) {
    const missing = (["fetch_page", "query", "search"] as const).filter((t) => set.has(t));
    // Only warn if user explicitly asked for unimplemented tools
    if (enabled?.length) {
      const unimplemented = missing.filter((t) => !implementedTools.has(t));
      if (unimplemented.length > 0) {
        console.error(
          `browser-mcp: tool(s) not implemented yet (skipped): ${unimplemented.join(", ")}`
        );
      }
    }
  }
}

const implementedTools = new Set<ToolName>(["screenshot"]);

export function listImplementedTools(): ToolName[] {
  return [...implementedTools];
}
