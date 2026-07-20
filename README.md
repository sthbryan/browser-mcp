# @sthbryan/browser-mcp

> Model Context Protocol server for **real browser** automation — Puppeteer + stealth, system browsers first.

Sibling to [obscura-mcp-server](https://github.com/sthbryan/obscura-mcp-server): use **Obscura** for light scrape/text; use **browser-mcp** when you need pixels / JS render / stealth search.

**npm:** [`@sthbryan/browser-mcp`](https://www.npmjs.com/package/@sthbryan/browser-mcp)

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

### `fetch_page`

Fetch a URL after JS render as `html`, `markdown`, or `text`.

```json
{ "url": "https://example.com", "type": "markdown", "template": "desktop" }
```

### `search`

Web search with stealth. Engines: **DuckDuckGo Lite** → DDG HTML → Brave.

```json
{ "query": "rust headless browser", "limit": 5 }
```

### `query`

Extract data with CSS selectors and/or text filters.

```json
{ "url": "https://example.com", "selector": "h1" }
```

```json
{ "url": "https://example.com", "selector": "a", "attribute": "href", "limit": 10 }
```

## Browser resolution (lightweight)

No Chromium download on install. At runtime, in order:

1. `BROWSER_MCP_EXECUTABLE_PATH` if set  
2. System apps: Chrome → Chromium → Brave → Edge (override with `BROWSER_MCP_BROWSER`)  
3. Local caches (Playwright/Puppeteer already on disk)  
4. **Last resort:** download Chrome to `~/.cache/browser-mcp` (disable with `BROWSER_MCP_ALLOW_DOWNLOAD=0`)

Always headless + `puppeteer-extra-plugin-stealth`.

## Install (MCP client)

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

Tool filter:

```bash
bunx @sthbryan/browser-mcp --tools=screenshot
bunx @sthbryan/browser-mcp --tools=search,query
```

See [INSTALL.md](./INSTALL.md).

## Requirements

- Node 18+ or Bun  
- A Chromium-based browser installed (**recommended**): Chrome / Brave / Edge  

```bash
export BROWSER_MCP_BROWSER=brave
export BROWSER_MCP_EXECUTABLE_PATH=/path/to/chrome
export BROWSER_MCP_ALLOW_DOWNLOAD=0
export BROWSER_MCP_ALLOW_PRIVATE=1
```

## Release / publish

CI (same pattern as obscura): on every PR/`main` push → lint, test, smoke, build.  
On tag `v*` → publish to npm + GitHub Release.

```bash
# 1) Ensure GitHub secret NPM_TOKEN (classic publish token for @sthbryan)
# 2) From a clean main branch:
bun run release          # tags current package.json (0.1.0) and pushes
bun run release patch    # bump + tag + push
bun run release --no-push
```

Tag must match `package.json` version (e.g. `v0.1.0` ↔ `0.1.0`).

## Architecture

```
MCP Client ──stdio──► browser-mcp
                          │
                          ▼
              resolve system browser
              (Chrome/Brave/Edge/…)
                          │
                          ▼
            puppeteer-core + stealth
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
         screenshot              search
         fetch_page              (DDG→Brave)
         query
```

## Development

```bash
bun install
bun test
bun run smoke
bun run check
bun run build
```

## License

MIT
