/**
 * CLI argument parsing for browser-mcp.
 *
 * Supported:
 *   --tools=screenshot,search   only register these tools
 *   --tools screenshot,search   same (space form)
 *   --allow-download            (also --no-allow-download)
 *   --allow-private             (also --no-allow-private)
 *   (no flag)                   register all tools, use env defaults
 */

export type ToolName = "screenshot" | "fetch_page" | "query" | "search";

export const ALL_TOOLS: readonly ToolName[] = [
  "screenshot",
  "fetch_page",
  "query",
  "search",
] as const;

const TOOL_SET = new Set<string>(ALL_TOOLS);

/** Parsed CLI options. `null` fields defer to env/default resolution in {@link applyRuntimeConfig}. */
export interface CliOptions {
  /** Tools to register. `null` means all. */
  tools: ToolName[] | null;
  /** Override {@link RuntimeConfig.allowDownload}. `null` means defer to env. */
  allowDownload: boolean | null;
  /** Override {@link RuntimeConfig.allowPrivate}. `null` means defer to env. */
  allowPrivate: boolean | null;
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

  return [...new Set(names)] as ToolName[];
}

/** Parse CLI argv into a {@link CliOptions} object. Unknown flags are silently ignored. */
export function parseCliArgs(argv: string[] = process.argv.slice(2)): CliOptions {
  let tools: ToolName[] | null = null;
  let allowDownload: boolean | null = null;
  let allowPrivate: boolean | null = null;

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
      continue;
    }

    if (arg === "--allow-download") {
      allowDownload = true;
      continue;
    }
    if (arg === "--no-allow-download") {
      allowDownload = false;
      continue;
    }
    if (arg === "--allow-private") {
      allowPrivate = true;
      continue;
    }
    if (arg === "--no-allow-private") {
      allowPrivate = false;
    }
  }

  return { tools, allowDownload, allowPrivate };
}

function printHelpAndExit(): never {
  console.error(`@sthbryan/browser-mcp — browser automation (Puppeteer stealth)

Usage:
  browser-mcp [options]
  bunx @sthbryan/browser-mcp --tools=screenshot
  bunx @sthbryan/browser-mcp --tools=screenshot,fetch_page

Options:
  --tools=<list>            Comma-separated tools to register. Default: all.
                            Available: ${ALL_TOOLS.join(", ")}
  --allow-download          Allow downloading Chrome as last resort (default).
  --no-allow-download       Fail cleanly when no system browser is found.
  --allow-private           Allow localhost / RFC1918 navigation (off by default).
  --no-allow-private        Keep SSRF guard on (default).
  -h, --help                Show this help

Flags override env vars (BROWSER_MCP_ALLOW_DOWNLOAD, BROWSER_MCP_ALLOW_PRIVATE).
`);
  process.exit(0);
}
