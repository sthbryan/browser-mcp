import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import { resolveViewport } from "@/browser/devices";
import { withPage } from "@/browser/manager";
import type { ScreenshotInput } from "@/types/screenshot";
import { validateNavigationUrl } from "@/utils/ssrf";

export function createScreenshotHandler() {
  return async (
    args: ScreenshotInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    try {
      validateNavigationUrl(args.url);

      const viewport = resolveViewport({
        template: args.template,
        width: args.width,
        height: args.height,
        deviceScaleFactor: args.deviceScaleFactor,
      });

      const { buffer, meta } = await withPage(viewport, async (page) => {
        if (args.darkMode) {
          await page.emulateMedia({ colorScheme: "dark" });
        }

        await page.goto(args.url, { waitUntil: args.waitUntil });

        const screenshotOpts = {
          type: args.format,
          fullPage: args.selector ? false : args.fullPage,
          ...(args.format === "jpeg" ? { quality: args.quality ?? 80 } : {}),
        } as const;

        let buffer: Buffer;
        if (args.selector) {
          const el = page.locator(args.selector).first();
          await el.waitFor({ state: "visible" });
          buffer = await el.screenshot(screenshotOpts);
        } else {
          buffer = await page.screenshot(screenshotOpts);
        }

        return {
          buffer,
          meta: {
            url: args.url,
            template: args.template,
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: viewport.deviceScaleFactor,
            fullPage: args.fullPage,
            format: args.format,
            darkMode: args.darkMode,
            selector: args.selector ?? null,
            finalUrl: page.url(),
            title: await page.title(),
          },
        };
      });

      const mimeType = args.format === "jpeg" ? "image/jpeg" : "image/png";
      const base64 = buffer.toString("base64");

      return {
        content: [
          {
            type: "image",
            data: base64,
            mimeType,
          },
          {
            type: "text",
            text: JSON.stringify(
              {
                ...meta,
                bytes: buffer.length,
                source: "playwright",
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
