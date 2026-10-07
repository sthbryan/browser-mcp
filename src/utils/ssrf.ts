import { getRuntimeConfig } from "@/config";

const PRIVATE_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::1", "[::1]"]);

function isPrivateIpv4(hostname: string): boolean {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  const d = Number(m[4]);
  if ([a, b, c, d].some((n) => n > 255)) return false;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (PRIVATE_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".local")) return true;
  if (isPrivateIpv4(host)) return true;
  return false;
}

export function assertPublicHttpUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Only http(s) URLs are allowed (got ${parsed.protocol})`);
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new Error(
      `Blocked private/local URL: ${parsed.hostname}. Set BROWSER_MCP_ALLOW_PRIVATE=1 to override for local dev.`
    );
  }
}

export function shouldAllowPrivate(): boolean {
  return getRuntimeConfig().allowPrivate;
}

export function validateNavigationUrl(url: string): void {
  if (shouldAllowPrivate()) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`Only http(s) URLs are allowed (got ${parsed.protocol})`);
    }
    return;
  }
  assertPublicHttpUrl(url);
}
