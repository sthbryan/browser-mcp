# Installation Guide — browser-mcp

## Prerequisites

```bash
bun install
```

Install a system browser (recommended): **Chrome**, **Brave**, **Edge**, or **Chromium**.

No `playwright:install` / Chromium download is required for normal use.

## Method 1: bunx (after publish)

```json
{
  "mcpServers": {
    "browser": {
      "command": "bunx",
      "args": ["-y", "browser-mcp"]
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
    "browser": {
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
    "browser": {
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

## Environment

| Variable | Example | Meaning |
|----------|---------|---------|
| `BROWSER_MCP_EXECUTABLE_PATH` | `/usr/bin/chromium` | Force browser binary |
| `BROWSER_MCP_BROWSER` | `brave` | Prefer chrome/chromium/brave/edge |
| `BROWSER_MCP_ALLOW_DOWNLOAD` | `0` | Disable last-resort Chrome download |
| `BROWSER_MCP_ALLOW_PRIVATE` | `1` | Allow localhost / RFC1918 |

## Pairing with obscura-mcp

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["-y", "obscura-mcp-server"]
    },
    "browser": {
      "command": "bun",
      "args": ["run", "/ABS/PATH/browser-mcp/src/index.ts"]
    }
  }
}
```

- **obscura** — light scrape/text  
- **browser** — stealth browser tools (screenshots, JS render, search)
