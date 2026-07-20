export const DEFAULT_CONTENT_SELECTORS =
  "p, h1, h2, h3, h4, h5, h6, li, a, span, td, th, button, label, [role='heading']";

export function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function filterByText(items: string[], text?: string | null): string[] {
  if (!text) return items;
  const needle = text.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => item.toLowerCase().includes(needle));
}

export function applyLimit(items: string[], limit: number): string[] {
  if (limit <= 0) return [];
  return items.slice(0, limit);
}

export function finalizeMatches(
  raw: Array<string | null | undefined>,
  opts: { text?: string | null; limit: number }
): string[] {
  const cleaned = raw.map((s) => (s ?? "").trim()).filter((s) => s.length > 0);
  return applyLimit(dedupeStrings(filterByText(cleaned, opts.text)), opts.limit);
}
