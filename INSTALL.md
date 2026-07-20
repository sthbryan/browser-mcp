# Installation Guide — browser-mcp

## Prerequisites

```bash
bun install
bun run playwright:install   # downloads Chromium for Playwright
```

## Method 1: bunx (after publish)

```json
{
  "mcpServers": {
    "browser": {
      "command": "bunx",
      "args": ["-y", "browser-mcp", "--tools=screenshot"]
    }
  }
}
```

## Method 2: Local clone

```bash
git clone https://github.com/sthbryan/browser-mcp
cd browser-mcp
bun install && bun run playwright:install
```

```json
{
  "mcpServers": {
    "browser": {
      "command": "bun",
      "args": [
        "run",
        "/ABS/PATH/browser-mcp/src/index.ts",
        "--tools=screenshot"
      ]
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
      "args": ["/ABS/PATH/browser-mcp/dist/index.js", "--tools=screenshot"]
    }
  }
}
```

## Tool filter examples

| Args | Effect |
|------|--------|
| (none) | All implemented tools |
| `--tools=screenshot` | Only screenshot |
| `--tools=screenshot,fetch_page,query` | Subset (unimplemented names are skipped with a stderr warning) |

## Environment

| Variable | Example | Meaning |
|----------|---------|---------|
| `BROWSER_MCP_CHANNEL` | `chrome` | Playwright browser channel |
| `BROWSER_MCP_EXECUTABLE_PATH` | `/usr/bin/chromium` | Explicit binary |
| `BROWSER_MCP_ALLOW_PRIVATE` | `1` | Allow localhost / RFC1918 |

## Pairing with obscura-mcp

Recommended dual setup:

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["-y", "obscura-mcp-server"]
    },
    "browser": {
      "command": "bunx",
      "args": ["-y", "browser-mcp", "--tools=screenshot"]
    }
  }
}
```

- **obscura** — scrape, search, markdown (light)  
- **browser** — screenshots / visual (Chromium)
