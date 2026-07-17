import type { FormatterType } from "@/types/formatters";
import { formatHtml } from "./html";
import { formatMarkdown } from "./markdown";
import { formatText } from "./text";

export const formatters: Record<FormatterType, (html: string) => Promise<string>> = {
  html: formatHtml,
  text: formatText,
  markdown: formatMarkdown,
};

export async function format(type: FormatterType, html: string): Promise<string> {
  const formatter = formatters[type];
  if (!formatter) {
    throw new Error(`Unknown formatter type: ${type}`);
  }
  return formatter(html);
}
