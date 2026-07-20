import { describe, expect, test } from "bun:test";
import { queryInputSchema } from "./query";

describe("queryInputSchema", () => {
  test("accepts selector only", () => {
    const parsed = queryInputSchema.parse({
      url: "https://example.com",
      selector: "h1",
    });
    expect(parsed.selector).toBe("h1");
    expect(parsed.limit).toBe(50);
    expect(parsed.template).toBe("desktop");
  });

  test("accepts text only", () => {
    const parsed = queryInputSchema.parse({
      url: "https://example.com",
      text: "Example",
    });
    expect(parsed.text).toBe("Example");
  });

  test("rejects missing selector and text", () => {
    const result = queryInputSchema.safeParse({ url: "https://example.com" });
    expect(result.success).toBe(false);
  });

  test("rejects attribute without selector", () => {
    const result = queryInputSchema.safeParse({
      url: "https://example.com",
      text: "x",
      attribute: "href",
    });
    expect(result.success).toBe(false);
  });

  test("accepts selector with attribute", () => {
    const parsed = queryInputSchema.parse({
      url: "https://example.com",
      selector: "a",
      attribute: "href",
      limit: 10,
    });
    expect(parsed.attribute).toBe("href");
    expect(parsed.limit).toBe(10);
  });

  test("rejects custom template without dimensions", () => {
    const result = queryInputSchema.safeParse({
      url: "https://example.com",
      selector: "h1",
      template: "custom",
    });
    expect(result.success).toBe(false);
  });
});
