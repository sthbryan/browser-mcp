import { describe, expect, test } from "bun:test";
import { parseCliArgs } from "./cli";

describe("parseCliArgs", () => {
  test("defaults to all tools (null)", () => {
    expect(parseCliArgs([])).toEqual({
      tools: null,
      allowDownload: null,
      allowPrivate: null,
    });
  });

  test("parses --tools=a,b", () => {
    expect(parseCliArgs(["--tools=screenshot,search"])).toEqual({
      tools: ["screenshot", "search"],
      allowDownload: null,
      allowPrivate: null,
    });
  });

  test("parses --tools a,b", () => {
    expect(parseCliArgs(["--tools", "screenshot"])).toEqual({
      tools: ["screenshot"],
      allowDownload: null,
      allowPrivate: null,
    });
  });

  test("dedupes tools", () => {
    expect(parseCliArgs(["--tools=screenshot,screenshot"])).toEqual({
      tools: ["screenshot"],
      allowDownload: null,
      allowPrivate: null,
    });
  });

  test("rejects unknown tools", () => {
    expect(() => parseCliArgs(["--tools=nope"])).toThrow(/Unknown tool/);
  });

  test("rejects empty --tools=", () => {
    expect(() => parseCliArgs(["--tools="])).toThrow(/at least one/);
  });

  test("parses --allow-download", () => {
    expect(parseCliArgs(["--allow-download"]).allowDownload).toBe(true);
  });

  test("parses --no-allow-download", () => {
    expect(parseCliArgs(["--no-allow-download"]).allowDownload).toBe(false);
  });

  test("parses --allow-private", () => {
    expect(parseCliArgs(["--allow-private"]).allowPrivate).toBe(true);
  });

  test("parses --no-allow-private", () => {
    expect(parseCliArgs(["--no-allow-private"]).allowPrivate).toBe(false);
  });

  test("parses combined flags", () => {
    expect(parseCliArgs(["--tools=screenshot", "--no-allow-download", "--allow-private"])).toEqual({
      tools: ["screenshot"],
      allowDownload: false,
      allowPrivate: true,
    });
  });
});
