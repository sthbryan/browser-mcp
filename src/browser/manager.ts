import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Browser, Page } from "puppeteer-core";
import puppeteerCore from "puppeteer-core";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { getRuntimeConfig } from "@/config";
import { type DetectedBrowser, resolveBrowserExecutable } from "./detect";
import { DESKTOP_USER_AGENT, type ViewportSpec } from "./devices";

const DEFAULT_NAV_TIMEOUT_MS = 30_000;

const puppeteer = addExtra(puppeteerCore);
puppeteer.use(StealthPlugin());

let browserPromise: Promise<Browser> | null = null;
let resolvedBrowser: DetectedBrowser | null = null;

function launchArgs(): string[] {
  return [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
  ];
}

function downloadAllowed(): boolean {
  return getRuntimeConfig().allowDownload;
}

async function downloadChromeLastResort(): Promise<DetectedBrowser> {
  if (!downloadAllowed()) {
    throw new Error(
      "No system browser found and download disabled (BROWSER_MCP_ALLOW_DOWNLOAD=0). " +
        "Install Chrome/Brave/Edge or set BROWSER_MCP_EXECUTABLE_PATH."
    );
  }

  console.error(
    "browser-mcp: no system browser found — downloading Chrome as last resort (~/.cache/browser-mcp)…"
  );

  const cacheDir = join(homedir(), ".cache", "browser-mcp");
  mkdirSync(cacheDir, { recursive: true });

  const { install, computeExecutablePath, detectBrowserPlatform, resolveBuildId } = await import(
    "@puppeteer/browsers"
  );

  const platform = detectBrowserPlatform();
  if (!platform) {
    throw new Error("Unsupported platform for Chrome download");
  }

  const tag = process.env.BROWSER_MCP_CHROME_BUILD_ID ?? "stable";
  const buildId = await resolveBuildId("chrome", platform, tag);
  await install({
    cacheDir,
    browser: "chrome",
    buildId,
    platform,
  });

  const executablePath = computeExecutablePath({
    cacheDir,
    browser: "chrome",
    buildId,
    platform,
  });

  console.error(`browser-mcp: downloaded Chrome → ${executablePath}`);
  return {
    name: "chrome",
    executablePath,
    source: "download",
  };
}

async function resolveExecutable(): Promise<DetectedBrowser> {
  const found = resolveBrowserExecutable();
  if (found) {
    console.error(`browser-mcp: using ${found.name} (${found.source}) → ${found.executablePath}`);
    return found;
  }
  return downloadChromeLastResort();
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = (async () => {
      const detected = await resolveExecutable();
      resolvedBrowser = detected;
      try {
        return (await puppeteer.launch({
          headless: true,
          executablePath: detected.executablePath,
          args: launchArgs(),
          defaultViewport: null,
        })) as Browser;
      } catch (err) {
        browserPromise = null;
        resolvedBrowser = null;
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Failed to launch browser at ${detected.executablePath}.\n${message}\n` +
            "Install Chrome/Brave/Edge or set BROWSER_MCP_EXECUTABLE_PATH."
        );
      }
    })();
  }
  return browserPromise;
}

export function getResolvedBrowserInfo(): DetectedBrowser | null {
  return resolvedBrowser;
}

export async function withPage<T>(
  viewport: ViewportSpec,
  fn: (page: Page) => Promise<T>
): Promise<T> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  page.setDefaultTimeout(DEFAULT_NAV_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(DEFAULT_NAV_TIMEOUT_MS);

  try {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
    });
    await page.setUserAgent(viewport.userAgent ?? DESKTOP_USER_AGENT);

    return await fn(page);
  } finally {
    await page.close().catch(() => {});
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
    resolvedBrowser = null;
  }
}

export function __resetBrowserManager(): void {
  browserPromise = null;
  resolvedBrowser = null;
}
