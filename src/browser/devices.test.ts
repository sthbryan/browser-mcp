import { describe, expect, test } from "bun:test";
import { resolveViewport } from "./devices";

describe("resolveViewport", () => {
  test("defaults to desktop", () => {
    const v = resolveViewport({});
    expect(v.width).toBe(1440);
    expect(v.height).toBe(900);
    expect(v.isMobile).toBe(false);
  });

  test("mobile template", () => {
    const v = resolveViewport({ template: "mobile" });
    expect(v.width).toBe(390);
    expect(v.isMobile).toBe(true);
    expect(v.hasTouch).toBe(true);
  });

  test("custom requires width/height", () => {
    expect(() => resolveViewport({ template: "custom" })).toThrow(/width and height/);
  });

  test("custom viewport", () => {
    const v = resolveViewport({ template: "custom", width: 800, height: 600 });
    expect(v.width).toBe(800);
    expect(v.height).toBe(600);
  });

  test("width override on template", () => {
    const v = resolveViewport({ template: "desktop", width: 1920 });
    expect(v.width).toBe(1920);
    expect(v.height).toBe(900);
  });
});
