import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import type { Page } from "playwright";
import { DEVICE_TEMPLATES } from "@/browser/devices";
import { withPage } from "@/browser/manager";
import type { SearchInput, SearchResult } from "@/types/search";
import { citeToUrl, extractRealUrl, normalizeHits, type RawSearchHit } from "./parse";

/**
 * Search engines to try in order. DDG HTML matches obscura-mcp; Bing is a
 * headless-friendly fallback when DDG serves a bot challenge.
 */
const ENGINES: Array<{
  name: string;
  buildUrl: (query: string) => string;
  scrape: (page: Page) => Promise<RawSearchHit[]>;
}> = [
  {
    name: "duckduckgo",
    buildUrl: (q) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
    scrape: scrapeDuckDuckGo,
  },
  {
    name: "bing",
    buildUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}&setlang=en`,
    scrape: scrapeBing,
  },
];

export function createSearchHandler() {
  return async (
    args: SearchInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    try {
      const { results, engine } = await withPage(DEVICE_TEMPLATES.desktop, async (page) => {
        let last: SearchResult[] = [];
        let used = "none";

        for (const engine of ENGINES) {
          const url = engine.buildUrl(args.query);
          await page.goto(url, { waitUntil: "domcontentloaded" });
          // brief settle for late result injection
          await page.waitForTimeout(800);

          const hits = await engine.scrape(page);
          const normalized = normalizeHits(hits, args.limit);
          last = normalized;
          used = engine.name;
          if (normalized.length > 0) {
            return { results: normalized, engine: engine.name };
          }
        }

        return { results: last, engine: used };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query: args.query,
                source: "playwright",
                engine,
                results,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  };
}

async function scrapeDuckDuckGo(page: Page): Promise<RawSearchHit[]> {
  return page.evaluate(() => {
    const out: Array<{ title: string; href: string; snippet?: string }> = [];
    const nodes = document.querySelectorAll(
      "a.result__a, .result__title a, .web-result a.result__a"
    );

    for (const a of Array.from(nodes)) {
      const el = a as HTMLAnchorElement;
      const row = el.closest(".result, .web-result, article") ?? el.parentElement;
      const snippetEl = row?.querySelector(".result__snippet, .result__body, .result-snippet");
      out.push({
        title: (el.textContent || "").trim(),
        href: el.href,
        snippet: snippetEl?.textContent?.trim() || undefined,
      });
    }
    return out;
  });
}

async function scrapeBing(page: Page): Promise<RawSearchHit[]> {
  // Wait up to a few seconds for organic results if the shell is already there.
  await page.waitForSelector("li.b_algo h2 a, #b_results h2 a", { timeout: 5_000 }).catch(() => {});

  const raw = await page.evaluate(() => {
    const out: Array<{ title: string; href: string; cite?: string; snippet?: string }> = [];
    const items = document.querySelectorAll("li.b_algo, #b_results > li");

    for (const li of Array.from(items)) {
      const a = li.querySelector("h2 a") as HTMLAnchorElement | null;
      if (!a?.href) continue;
      const cite = li.querySelector("cite")?.textContent?.trim();
      const snippet = li
        .querySelector(".b_caption p, .b_lineclamp2, .b_algoSlug, .b_caption")
        ?.textContent?.trim();
      out.push({
        title: (a.textContent || "").trim(),
        href: a.href,
        cite,
        snippet,
      });
    }
    return out;
  });

  return raw.map((hit) => {
    const fromCite = citeToUrl(hit.cite);
    const href = fromCite || extractRealUrl(hit.href);
    return {
      title: hit.title,
      href,
      snippet: hit.snippet,
    };
  });
}
