import TurndownService from "turndown";
import { cleanHtml } from "./clean";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export async function formatMarkdown(html: string): Promise<string> {
  return turndown.turndown(cleanHtml(html));
}
