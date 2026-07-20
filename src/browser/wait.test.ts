import { describe, expect, test } from "bun:test";
import { mapWaitUntil, sleep } from "./wait";

describe("mapWaitUntil", () => {
  test("maps known values", () => {
    expect(mapWaitUntil("domcontentloaded")).toBe("domcontentloaded");
    expect(mapWaitUntil("networkidle")).toBe("networkidle2");
    expect(mapWaitUntil("commit")).toBe("domcontentloaded");
    expect(mapWaitUntil("load")).toBe("load");
  });

  test("defaults undefined to load", () => {
    expect(mapWaitUntil(undefined)).toBe("load");
  });
});

describe("sleep", () => {
  test("resolves after delay", async () => {
    const start = Date.now();
    await sleep(30);
    expect(Date.now() - start).toBeGreaterThanOrEqual(20);
  });
});
