/**
 * CLI argument parsing for browser-mcp.
 *
 * Supported:
 *   --tools=screenshot,search   only register these tools
 *   --tools screenshot,search   same (space form)
 *   (no flag)                   register all tools
 */

export type ToolName = "screenshot" | "fetch_page" | "query" | "search";

export const ALL_TOOLS: readonly ToolName[] = [
  "screenshot",
  "fetch_page",
  "query",
  "search",
] as const;

const TOOL_SET = new Set<string>(ALL_TOOLS);

export interface CliOptions {
  /** Tools to register. null means all. */
  tools: ToolName[] | null;
}

function parseToolsList(raw: string): ToolName[] {
  const names = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (names.length === 0) {
    throw new Error("--tools requires at least one tool name");
  }

  const invalid = names.filter((n) => !TOOL_SET.has(n));
  if (invalid.length > 0) {
    throw new Error(`Unknown tool(s): ${invalid.join(", ")}. Available: ${ALL_TOOLS.join(", ")}`);
  }

  // de-dupe, preserve order
  return [...new Set(names)] as ToolName[];
}

export function parseCliArgs(argv: string[] = process.argv.slice(2)): CliOptions {
  let tools: ToolName[] | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    }

    if (arg.startsWith("--tools=")) {
      tools = parseToolsList(arg.slice("--tools=".length));
      continue;
    }

    if (arg === "--tools") {
      const next = argv[i + 1];
      if (!next || next.startsWith("-")) {
        throw new Error("--tools requires a comma-separated list (e.g. screenshot,search)");
      }
      tools = parseToolsList(next);
      i++;
    }

    // ignore unknown flags for now (MCP clients may inject extra args)
  }

  return { tools };
}

function printHelpAndExit(): never {
  console.error(`browser-mcp — MCP server for browser automation (Playwright/Chromium)

Usage:
  browser-mcp [options]
  bunx browser-mcp --tools=screenshot
  bunx browser-mcp --tools=screenshot,fetch_page

Options:
  --tools=<list>   Comma-separated tools to register. Default: all.
                   Available: ${ALL_TOOLS.join(", ")}
  -h, --help       Show this help

No native-fetch fallback: requires Playwright Chromium
  (run: bun run playwright:install)
`);
  process.exit(0);
}
