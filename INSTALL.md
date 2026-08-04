# Installation Guide — @sthbryan/browser-mcp

## Prerequisites

Install a system browser (recommended): **Chrome**, **Brave**, **Edge**, or **Chromium**.

No Chromium download is required for normal use.

## Method 1: bunx / npx (npm)

```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "bunx",
      "args": ["-y", "@sthbryan/browser-mcp"]
    }
  }
}
```

Or with Node:

```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "npx",
      "args": ["-y", "@sthbryan/browser-mcp"]
    }
  }
}
```

## Method 2: Local clone

```bash
git clone https://github.com/sthbryan/browser-mcp
cd browser-mcp
bun install
```

```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "bun",
      "args": ["run", "/ABS/PATH/browser-mcp/src/index.ts"]
    }
  }
}
```

## Method 3: Built binary

```bash
bun run build
```

```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "node",
      "args": ["/ABS/PATH/browser-mcp/dist/index.js"]
    }
  }
}
```

## Tool filter examples

| Args | Effect |
|------|--------|
| (none) | All tools |
| `--tools=screenshot` | Only screenshot |
| `--tools=screenshot,fetch_page,query` | Subset |
| `--no-allow-download` | Fail cleanly when no system browser is found (no auto-download) |
| `--allow-private` | Allow localhost / RFC1918 navigation (SSRF guard off) |
| `--no-allow-private` | Keep SSRF guard on (default) |

## Environment

| Variable | Example | Meaning |
|----------|---------|---------|
| `BROWSER_MCP_EXECUTABLE_PATH` | `/usr/bin/chromium` | Force browser binary |
| `BROWSER_MCP_BROWSER` | `brave` | Prefer chrome/chromium/brave/edge |
| `BROWSER_MCP_ALLOW_DOWNLOAD` | `0` | Disable last-resort Chrome download (default: enabled) |
| `BROWSER_MCP_ALLOW_PRIVATE` | `1` | Allow localhost / RFC1918 (default: blocked, SSRF guard) |

Precedence: **CLI flag > env var > default**.

## Pairing with obscura-mcp

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["-y", "obscura-mcp-server"]
    },
    "browser-mcp": {
      "command": "bunx",
      "args": ["-y", "@sthbryan/browser-mcp"]
    }
  }
}
```

- **obscura** — light scrape/text  
- **browser-mcp** — stealth browser tools (screenshots, JS render, search)

## Publish (maintainers)

1. Add GitHub secret **`NPM_TOKEN`** (npm access token with publish on `@sthbryan`).  
2. Optional: environment **`npm`** on the repo (workflow already references it).  
3. From clean `main`:

```bash
bun run release          # first release: tags v0.1.0 from package.json
# or
bun run release patch
```

Pushing tag `v0.1.0` runs CI then `npm publish --access public`.
