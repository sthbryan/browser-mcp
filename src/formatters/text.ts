import { cleanHtml } from "./clean";

const BLOCK_TAG_CLOSE = /<\/(p|div|h[1-6]|li|tr)>/gi;
const ANY_TAG = /<[^>]+>/g;
const HTML_ENTITIES_RE = /&(?:nbsp|amp|lt|gt|quot|#39);/g;
const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export async function formatText(html: string): Promise<string> {
  return cleanHtml(html)
    .replace(BLOCK_TAG_CLOSE, "\n")
    .replace(ANY_TAG, "")
    .replace(HTML_ENTITIES_RE, (m) => HTML_ENTITIES[m] ?? m)
    .replace(/\n\s*\n/g, "\n")
    .trim();
}
