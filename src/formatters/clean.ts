/**
 * Clean HTML for LLM consumption (single-pass parse).
 */

import { type HTMLElement, parse } from "node-html-parser";
import type { FormatterType } from "@/types/formatters";

const USELESS_TAGS = [
  "head",
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "form",
  "input",
  "button",
];

const USEFUL_ATTRS = new Set(["href", "src"]);

const NOISE_SELECTORS = [
  "nav",
  "footer",
  "aside",
  "header:not(article header)",
  ".ads",
  ".advertisement",
  '[class*="ad-"]',
  ".sidebar",
  ".side-bar",
  ".social",
  ".share",
  ".newsletter",
  '[class*="cookie"]',
  '[class*="popup"]',
  ".nav",
  ".menu",
  ".header:not(header > h1)",
  ".cookie",
  ".popup",
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[aria-hidden="true"]',
];

function stripUselessTags(root: HTMLElement): void {
  for (const tag of USELESS_TAGS) {
    for (const el of root.querySelectorAll(tag)) {
      el.remove();
    }
  }
}

function stripNoiseSelectors(root: HTMLElement): void {
  for (const selector of NOISE_SELECTORS) {
    try {
      for (const el of root.querySelectorAll(selector)) {
        el.remove();
      }
    } catch {
      // ignore invalid selectors
    }
  }
}

function stripUselessAttributes(root: HTMLElement): void {
  for (const el of root.querySelectorAll("*")) {
    const attrs = el.attributes;
    for (const attr of Object.keys(attrs)) {
      if (!USEFUL_ATTRS.has(attr)) {
        el.removeAttribute(attr);
      }
    }
  }
}

export function cleanHtml(html: string): string {
  const root = parse(html);
  stripUselessTags(root);
  stripNoiseSelectors(root);
  stripUselessAttributes(root);
  return root.toString();
}

export function sanitizeWhitespace(text: string, type: FormatterType): string {
  if (type === "markdown") return text;

  return text
    .replace(/\n\s*\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}
