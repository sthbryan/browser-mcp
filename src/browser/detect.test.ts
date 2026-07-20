import { describe, expect, test } from "bun:test";
import { listSystemBrowsers, resolveBrowserExecutable } from "./detect";

describe("listSystemBrowsers", () => {
  test("returns array (may be empty on CI)", () => {
    const list = listSystemBrowsers();
    expect(Array.isArray(list)).toBe(true);
    for (const b of list) {
      expect(b.executablePath.length).toBeGreaterThan(0);
      expect(b.source).toBe("system");
    }
  });
});

describe("resolveBrowserExecutable", () => {
  test("honors explicit path when executable exists", () => {
    const system = listSystemBrowsers();
    if (system.length === 0) return;
    const first = system[0]!;
    const resolved = resolveBrowserExecutable({
      executablePath: first.executablePath,
      allowCache: false,
    });
    expect(resolved?.source).toBe("env");
    expect(resolved?.executablePath).toBe(first.executablePath);
  });

  test("prefers named browser when present", () => {
    const system = listSystemBrowsers();
    const brave = system.find((b) => b.name === "brave");
    if (!brave) return;
    const resolved = resolveBrowserExecutable({ prefer: "brave", allowCache: false });
    expect(resolved?.name).toBe("brave");
  });
});
