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
    const first = system[0];
    if (!first) return;
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

  test("returns null for missing explicit path when no system browsers", () => {
    const resolved = resolveBrowserExecutable({
      executablePath: "/nonexistent/browser-mcp-chrome-xyz",
      allowCache: false,
    });
    if (listSystemBrowsers().length === 0) {
      expect(resolved).toBeNull();
    }
  });

  test("resolves something when system browser exists", () => {
    const system = listSystemBrowsers();
    if (system.length === 0) return;
    const resolved = resolveBrowserExecutable({ allowCache: false });
    expect(resolved).not.toBeNull();
    expect(resolved?.source).toBe("system");
    expect(resolved?.executablePath.length).toBeGreaterThan(0);
  });
});
