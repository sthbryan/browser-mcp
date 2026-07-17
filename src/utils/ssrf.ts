/**
 * Basic SSRF guards for navigation targets.
 * Block private networks and file:// by default.
 */

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.0\.0\.0|\[::1\]|::1)$/i;

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

  const host = parsed.hostname;
  if (PRIVATE_HOST_RE.test(host) || host.endsWith(".local")) {
    throw new Error(
      `Blocked private/local URL: ${host}. Set BROWSER_MCP_ALLOW_PRIVATE=1 to override for local dev.`
    );
  }
}

export function shouldAllowPrivate(): boolean {
  return process.env.BROWSER_MCP_ALLOW_PRIVATE === "1";
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
