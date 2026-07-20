import { describe, expect, test } from "bun:test";
import { citeToUrl, extractRealUrl, normalizeHits } from "./parse";

describe("extractRealUrl", () => {
  test("unwraps uddg param", () => {
    const wrapped = `https://duckduckgo.com/l/?uddg=${encodeURIComponent("https://example.com/page")}`;
    expect(extractRealUrl(wrapped)).toBe("https://example.com/page");
  });

  test("passes through plain urls", () => {
    expect(extractRealUrl("https://example.com")).toBe("https://example.com");
  });
});

describe("citeToUrl", () => {
  test("normalizes bare host cites", () => {
    expect(citeToUrl("www.typescriptlang.org › docs")).toBe("https://www.typescriptlang.org");
  });

  test("keeps absolute cites", () => {
    expect(citeToUrl("https://example.com/path")).toBe("https://example.com/path");
  });
});

describe("normalizeHits", () => {
  test("dedupes, strips engine urls, respects limit", () => {
    const results = normalizeHits(
      [
        { title: "A", href: "https://a.example" },
        { title: "A2", href: "https://a.example" },
        { title: "DDG", href: "https://duckduckgo.com/foo" },
        { title: "Brave", href: "https://search.brave.com/search?q=x" },
        { title: "B", href: "https://b.example", snippet: " hi " },
        { title: "C", href: "https://c.example" },
      ],
      2
    );
    expect(results).toEqual([
      { title: "A", url: "https://a.example" },
      { title: "B", url: "https://b.example", snippet: "hi" },
    ]);
  });

  test("skips non-http hrefs", () => {
    expect(
      normalizeHits(
        [
          { title: "x", href: "javascript:void(0)" },
          { title: "ok", href: "https://ok.example" },
        ],
        5
      )
    ).toEqual([{ title: "ok", url: "https://ok.example" }]);
  });
});
