import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import { resolveViewport } from "@/browser/devices";
import { withPage } from "@/browser/manager";
import { format } from "@/formatters";
import { sanitizeWhitespace } from "@/formatters/clean";
import type { FetchInput } from "@/types/fetch";
import type { FormatterType } from "@/types/formatters";
import { validateNavigationUrl } from "@/utils/ssrf";

export function createFetchHandler() {
  return async (
    args: FetchInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    try {
      validateNavigationUrl(args.url);

      const viewport = resolveViewport({
        template: args.template,
        width: args.width,
        height: args.height,
      });

      const { content, finalUrl, title } = await withPage(viewport, async (page) => {
        await page.goto(args.url, { waitUntil: args.waitUntil });
        const html = await page.content();
        const formatted = await format(args.type as FormatterType, html);
        return {
          content: sanitizeWhitespace(formatted, args.type as FormatterType),
          finalUrl: page.url(),
          title: await page.title(),
        };
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
                type: args.type,
                template: args.template,
                source: "playwright",
                length: content.length,
                content,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  };
}
