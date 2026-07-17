/**
 * Search result helpers (adapted from obscura-mcp-server + Bing cite cleanup).
 */

import type { SearchResult } from "@/types/search";

/** Unwrap engine redirect URLs (DDG `uddg=`, Bing tracking when possible). */
export function extractRealUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const uddg = parsed.searchParams.get("uddg");
    if (uddg) return decodeURIComponent(uddg);
  } catch {
    // fall through
  }

  const uddgMatch = url.match(/uddg=([^&]+)/);
  if (uddgMatch?.[1]) {
    try {
      return decodeURIComponent(uddgMatch[1]);
    } catch {
      return url;
    }
  }
  return url;
}

/** Turn Bing/Google-style cite text into an absolute URL when possible. */
export function citeToUrl(cite: string | undefined | null): string | null {
  if (!cite) return null;
  const first = cite
    .split(/[\n›>]/)[0]
    ?.trim()
    .replace(/\s+/g, "");
  if (!first) return null;
  if (first.startsWith("http://") || first.startsWith("https://")) return first;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(first)) return `https://${first}`;
  return null;
}

export interface RawSearchHit {
  title: string;
  href: string;
  snippet?: string;
}

export function normalizeHits(hits: RawSearchHit[], limit: number): SearchResult[] {
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    if (results.length >= limit) break;

    const href = hit.href?.trim();
    if (!href?.startsWith("http")) continue;

    const url = extractRealUrl(href);
    if (seen.has(url)) continue;
    if (url.includes("duckduckgo.com")) continue;

    seen.add(url);
    results.push({
      title: (hit.title || url).trim(),
      url,
      ...(hit.snippet?.trim() ? { snippet: hit.snippet.trim() } : {}),
    });
  }

  return results;
}
