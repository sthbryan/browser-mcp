import { accessSync, constants, existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type BrowserName = "chrome" | "chromium" | "brave" | "edge" | "canary";

export interface DetectedBrowser {
  name: BrowserName | "custom" | "cache";
  executablePath: string;
  source: "env" | "system" | "cache" | "download";
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return existsSync(path);
  }
}

function macCandidates(): Array<{ name: BrowserName; path: string }> {
  return [
    {
      name: "chrome",
      path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
    {
      name: "canary",
      path: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    },
    {
      name: "chromium",
      path: "/Applications/Chromium.app/Contents/MacOS/Chromium",
    },
    {
      name: "brave",
      path: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    },
    {
      name: "edge",
      path: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    },
  ];
}

function linuxCandidates(): Array<{ name: BrowserName; path: string }> {
  const bins: Array<{ name: BrowserName; bin: string }> = [
    { name: "chrome", bin: "google-chrome-stable" },
    { name: "chrome", bin: "google-chrome" },
    { name: "chromium", bin: "chromium-browser" },
    { name: "chromium", bin: "chromium" },
    { name: "brave", bin: "brave-browser" },
    { name: "brave", bin: "brave" },
    { name: "edge", bin: "microsoft-edge" },
    { name: "edge", bin: "microsoft-edge-stable" },
  ];
  const paths: Array<{ name: BrowserName; path: string }> = [];
  const pathEnv = process.env.PATH?.split(":") ?? [];
  for (const { name, bin } of bins) {
    for (const dir of pathEnv) {
      const full = join(dir, bin);
      if (isExecutable(full)) paths.push({ name, path: full });
    }
  }
  return paths;
}

function winCandidates(): Array<{ name: BrowserName; path: string }> {
  const local = process.env.LOCALAPPDATA ?? "";
  const pf = process.env.PROGRAMFILES ?? "C:\\Program Files";
  const pf86 = process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)";
  return [
    { name: "chrome", path: join(pf, "Google", "Chrome", "Application", "chrome.exe") },
    { name: "chrome", path: join(pf86, "Google", "Chrome", "Application", "chrome.exe") },
    { name: "chrome", path: join(local, "Google", "Chrome", "Application", "chrome.exe") },
    { name: "edge", path: join(pf, "Microsoft", "Edge", "Application", "msedge.exe") },
    { name: "edge", path: join(pf86, "Microsoft", "Edge", "Application", "msedge.exe") },
    { name: "brave", path: join(pf, "BraveSoftware", "Brave-Browser", "Application", "brave.exe") },
    {
      name: "brave",
      path: join(local, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
    },
    { name: "chromium", path: join(local, "Chromium", "Application", "chrome.exe") },
  ];
}

export function listSystemBrowsers(): DetectedBrowser[] {
  const platform = process.platform;
  const candidates =
    platform === "darwin"
      ? macCandidates()
      : platform === "win32"
        ? winCandidates()
        : linuxCandidates();

  const out: DetectedBrowser[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (!isExecutable(c.path) || seen.has(c.path)) continue;
    seen.add(c.path);
    out.push({ name: c.name, executablePath: c.path, source: "system" });
  }
  return out;
}

function listCacheBrowsers(): DetectedBrowser[] {
  const home = homedir();
  const roots: string[] = [];

  if (process.platform === "darwin") {
    roots.push(
      join(home, "Library/Caches/ms-playwright"),
      join(home, "Library/Caches/puppeteer"),
      join(home, ".cache/puppeteer"),
      join(home, ".cache/browser-mcp")
    );
  } else if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA ?? join(home, "AppData", "Local");
    roots.push(
      join(local, "ms-playwright"),
      join(local, "puppeteer"),
      join(home, ".cache", "browser-mcp")
    );
  } else {
    roots.push(
      join(home, ".cache/ms-playwright"),
      join(home, ".cache/puppeteer"),
      join(home, ".cache/browser-mcp")
    );
  }

  const names = new Set([
    "chrome",
    "chrome.exe",
    "Chromium",
    "chrome-headless-shell",
    "headless_shell",
  ]);

  const out: DetectedBrowser[] = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    walkForExecutables(root, names, out, 6);
  }
  return out;
}

function walkForExecutables(
  dir: string,
  names: Set<string>,
  out: DetectedBrowser[],
  depth: number
): void {
  if (depth <= 0) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (names.has(entry) && isExecutable(full)) {
      out.push({ name: "cache", executablePath: full, source: "cache" });
      continue;
    }
    try {
      if (statSync(full).isDirectory() && !entry.startsWith(".")) {
        walkForExecutables(full, names, out, depth - 1);
      }
    } catch {
      // skip
    }
  }
}

const PREFERRED_ORDER: BrowserName[] = ["chrome", "chromium", "brave", "edge", "canary"];

function pickByPreference(
  browsers: DetectedBrowser[],
  prefer?: string | null
): DetectedBrowser | null {
  if (!browsers.length) return null;
  if (prefer) {
    const want = prefer.toLowerCase();
    const match = browsers.find(
      (b) => b.name === want || b.executablePath.toLowerCase().includes(want)
    );
    if (match) return match;
  }
  for (const name of PREFERRED_ORDER) {
    const hit = browsers.find((b) => b.name === name);
    if (hit) return hit;
  }
  return browsers[0] ?? null;
}

export function resolveBrowserExecutable(opts?: {
  executablePath?: string | null;
  prefer?: string | null;
  allowCache?: boolean;
}): DetectedBrowser | null {
  const envPath = opts?.executablePath ?? process.env.BROWSER_MCP_EXECUTABLE_PATH;
  if (envPath && isExecutable(envPath)) {
    return { name: "custom", executablePath: envPath, source: "env" };
  }

  const prefer = opts?.prefer ?? process.env.BROWSER_MCP_BROWSER ?? null;
  const system = listSystemBrowsers();
  const picked = pickByPreference(system, prefer);
  if (picked) return picked;

  if (opts?.allowCache !== false) {
    const cached = listCacheBrowsers();
    const cachePick = pickByPreference(cached, prefer);
    if (cachePick) return cachePick;
  }

  return null;
}
