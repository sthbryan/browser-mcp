import { describe, expect, test } from "bun:test";
import { parseCliArgs } from "./cli";

describe("parseCliArgs", () => {
  test("defaults to all tools (null)", () => {
    expect(parseCliArgs([])).toEqual({ tools: null });
  });

  test("parses --tools=a,b", () => {
    expect(parseCliArgs(["--tools=screenshot,search"])).toEqual({
      tools: ["screenshot", "search"],
    });
  });

  test("parses --tools a,b", () => {
    expect(parseCliArgs(["--tools", "screenshot"])).toEqual({
      tools: ["screenshot"],
    });
  });

  test("dedupes tools", () => {
    expect(parseCliArgs(["--tools=screenshot,screenshot"])).toEqual({
      tools: ["screenshot"],
    });
  });

  test("rejects unknown tools", () => {
    expect(() => parseCliArgs(["--tools=nope"])).toThrow(/Unknown tool/);
  });

  test("rejects empty --tools=", () => {
    expect(() => parseCliArgs(["--tools="])).toThrow(/at least one/);
  });
});
