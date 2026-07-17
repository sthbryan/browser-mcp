/**
 * Shared Playwright browser lifecycle.
 *
 * One browser instance per MCP process. No native-fetch fallback —
 * if Chromium is missing, tools fail with a clear install message.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { ViewportSpec } from "./devices";

const DEFAULT_NAV_TIMEOUT_MS = 30_000;

let browserPromise: Promise<Browser> | null = null;

function chromiumLaunchOptions() {
  // Prefer bundled Chromium. Optional system Chrome via env.
  const channel = process.env.BROWSER_MCP_CHANNEL; // e.g. "chrome" | "msedge"
  const executablePath = process.env.BROWSER_MCP_EXECUTABLE_PATH;

  return {
    headless: true,
    ...(channel ? { channel: channel as "chrome" | "msedge" | "chrome-beta" } : {}),
    ...(executablePath ? { executablePath } : {}),
  };
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch(chromiumLaunchOptions()).catch((err) => {
      browserPromise = null;
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to launch Chromium. Install with: bun run playwright:install\n${message}`
      );
    });
  }
  return browserPromise;
}

export async function withPage<T>(
  viewport: ViewportSpec,
  fn: (page: Page, context: BrowserContext) => Promise<T>
): Promise<T> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    userAgent: viewport.userAgent,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(DEFAULT_NAV_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(DEFAULT_NAV_TIMEOUT_MS);

  try {
    return await fn(page, context);
  } finally {
    await context.close().catch(() => {});
  }
}

export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    // ignore shutdown races
  } finally {
    browserPromise = null;
  }
}

/** Test-only reset. */
export function __resetBrowserManager(): void {
  browserPromise = null;
}
