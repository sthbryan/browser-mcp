import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import type { Page } from "puppeteer-core";
import { DEVICE_TEMPLATES } from "@/browser/devices";
import { withPage } from "@/browser/manager";
import { sleep } from "@/browser/wait";
import type { SearchInput, SearchResult } from "@/types/search";
import { normalizeHits, type RawSearchHit } from "./parse";

const ENGINES: Array<{
  name: string;
  buildUrl: (query: string) => string;
  scrape: (page: Page) => Promise<RawSearchHit[]>;
}> = [
  {
    name: "duckduckgo-lite",
    buildUrl: (q) => `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}`,
    scrape: scrapeDuckDuckGoLite,
  },
  {
    name: "duckduckgo",
    buildUrl: (q) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
    scrape: scrapeDuckDuckGo,
  },
  {
    name: "brave",
    buildUrl: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
    scrape: scrapeBrave,
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
          await sleep(800);

          if (await isSearchBlocked(page)) {
            last = [];
            used = engine.name;
            continue;
          }

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
                source: "puppeteer",
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

async function isSearchBlocked(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const text = document.body?.innerText || "";
    if (
      text.includes("Unfortunately, bots use DuckDuckGo") ||
      text.includes("If this persists, please email us") ||
      text.includes("Please solve the challenge") ||
      text.includes("Verification required")
    ) {
      return true;
    }
    return Boolean(
      document.querySelector(
        "#challenge-form, .anomaly-modal__modal, form[action*='anomaly'], #b_captchachallenge"
      )
    );
  });
}

async function scrapeDuckDuckGoLite(page: Page): Promise<RawSearchHit[]> {
  return page.evaluate(() => {
    const out: Array<{ title: string; href: string; snippet?: string }> = [];
    const links = document.querySelectorAll("a.result-link");

    for (const a of Array.from(links)) {
      const el = a as HTMLAnchorElement;
      const title = (el.textContent || "").trim();
      const href = el.href;
      if (!title || !href) continue;

      const row = el.closest("tr");
      const next = row?.nextElementSibling;
      const snippetEl =
        next?.querySelector(".result-snippet") ||
        row?.parentElement?.querySelector(".result-snippet");
      const snippet = snippetEl?.textContent?.trim() || undefined;

      out.push({ title, href, snippet });
    }

    return out;
  });
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

async function scrapeBrave(page: Page): Promise<RawSearchHit[]> {
  await page
    .waitForSelector('.snippet[data-type="web"] a[href^="http"]', { timeout: 8_000 })
    .catch(() => {});

  return page.evaluate(() => {
    const out: Array<{ title: string; href: string; snippet?: string }> = [];
    const cards = document.querySelectorAll('.snippet[data-type="web"]');

    for (const card of Array.from(cards)) {
      const a = card.querySelector("a[href^='http']") as HTMLAnchorElement | null;
      if (!a?.href) continue;
      if (a.href.includes("search.brave.com")) continue;

      const titleEl = card.querySelector(".title, a");
      const title = (titleEl?.textContent || a.textContent || "").trim();
      const snippet = card
        .querySelector(".snippet-description, .description, p")
        ?.textContent?.trim();

      if (!title) continue;
      out.push({ title, href: a.href, snippet });
    }
    return out;
  });
}
