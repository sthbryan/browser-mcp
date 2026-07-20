# browser-mcp

> Model Context Protocol server for **real browser** automation — screenshots, viewports, and page tools via Playwright/Chromium.

Sibling to [obscura-mcp-server](https://github.com/sthbryan/obscura-mcp-server): use **Obscura** for light scrape/text; use **browser-mcp** when you need pixels.

## Tools

### `screenshot`

Capture a page with device templates or a custom size.

```json
{
  "url": "https://example.com",
  "template": "mobile",
  "fullPage": false,
  "format": "png"
}
```

Templates: `mobile` (390×844), `tablet` (768×1024), `desktop` (1440×900), `custom` (+ `width`/`height`).

Returns an MCP **image** content block plus JSON metadata.

### `fetch_page`

Fetch a URL **after JS render** (Playwright) as `html`, `markdown`, or `text`.

```json
{ "url": "https://example.com", "type": "markdown", "template": "desktop" }
```

### `search`

Web search via DuckDuckGo HTML rendered in Chromium.

```json
{ "query": "rust headless browser", "limit": 5 }
```

### `query`

Extract specific data from a **JS-rendered** page with CSS selectors and/or text filters.

```json
{ "url": "https://example.com", "selector": "h1" }
```

```json
{
  "url": "https://example.com",
  "selector": "a",
  "attribute": "href",
  "limit": 10
}
```

```json
{ "url": "https://example.com", "text": "Example" }
```

Provide at least one of `selector` or `text`. Optional: `attribute`, `limit`, `template`, `waitUntil`, `waitFor`.

## Tool selection

Load only the tools you need (keeps the agent tool list small):

```bash
bunx browser-mcp --tools=screenshot
bunx browser-mcp --tools=screenshot,fetch_page
bunx browser-mcp   # all implemented tools
```

## Requirements

- Node 18+ or Bun  
- Playwright Chromium (bundled):

```bash
bun install
bun run playwright:install
```

Optional: use system Chrome instead of bundled Chromium:

```bash
export BROWSER_MCP_CHANNEL=chrome
# or
export BROWSER_MCP_EXECUTABLE_PATH=/path/to/chrome
```

Allow localhost / private IPs (dev only):

```bash
export BROWSER_MCP_ALLOW_PRIVATE=1
```

**No native-fetch fallback.** If the browser cannot launch, tools error with install hints.

## Install (MCP client)

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

Local clone:

```json
{
  "mcpServers": {
    "browser": {
      "command": "bun",
      "args": ["run", "/path/to/browser-mcp/src/index.ts", "--tools=screenshot"]
    }
  }
}
```

See [INSTALL.md](./INSTALL.md) for more clients.

## Architecture

```
MCP Client ──stdio──► browser-mcp (--tools=…)
                          │
                          ▼
                   Playwright manager
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
       Chromium bundled         system Chrome
         (default)              (optional)
```

## Development

```bash
bun install
bun run playwright:install
bun test
bun run smoke
bun run lint
bun run build
```

## License

MIT
