import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import type { Page } from "puppeteer-core";
import { resolveViewport } from "@/browser/devices";
import { withPage } from "@/browser/manager";
import { mapWaitUntil } from "@/browser/wait";
import type { QueryInput } from "@/types/query";
import { validateNavigationUrl } from "@/utils/ssrf";
import { DEFAULT_CONTENT_SELECTORS, finalizeMatches } from "./extract";

export function createQueryHandler() {
  return async (
    args: QueryInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    try {
      if (!args.selector && !args.text) {
        return errorResult("Either 'selector' or 'text' must be provided");
      }
      if (args.attribute && !args.selector) {
        return errorResult("attribute requires a selector");
      }

      validateNavigationUrl(args.url);

      const viewport = resolveViewport({
        template: args.template,
        width: args.width,
        height: args.height,
      });

      const selectorUsed = args.selector ?? DEFAULT_CONTENT_SELECTORS;

      const { values, finalUrl, title } = await withPage(viewport, async (page) => {
        await page.goto(args.url, { waitUntil: mapWaitUntil(args.waitUntil) });

        if (args.waitFor) {
          await page.waitForSelector(args.waitFor, { timeout: 15_000 });
        } else if (args.selector) {
          await page.waitForSelector(args.selector, { timeout: 8_000 }).catch(() => {});
        }

        const values = await collectFromPage(page, {
          selector: selectorUsed,
          attribute: args.attribute,
        });

        return {
          values,
          finalUrl: page.url(),
          title: await page.title(),
        };
      });

      const result = finalizeMatches(values, {
        text: args.text,
        limit: args.limit,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                url: args.url,
                finalUrl,
                title,
                source: "puppeteer",
                selector: args.selector ?? null,
                selector_used: selectorUsed,
                text: args.text ?? null,
                attribute: args.attribute ?? null,
                count: result.length,
                result,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Query failed";
      return errorResult(message);
    }
  };
}

async function collectFromPage(
  page: Page,
  opts: { selector: string; attribute?: string }
): Promise<string[]> {
  return page.evaluate(
    (selector: string, attribute: string | null) => {
      let nodes: Element[];
      try {
        nodes = Array.from(document.querySelectorAll(selector));
      } catch {
        return [] as string[];
      }

      const out: string[] = [];
      for (const el of nodes) {
        if (attribute) {
          const v = el.getAttribute(attribute);
          if (v?.trim()) out.push(v.trim());
        } else {
          const t = (el.textContent || "").trim();
          if (t) out.push(t);
        }
      }
      return out;
    },
    opts.selector,
    opts.attribute ?? null
  );
}

function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}
