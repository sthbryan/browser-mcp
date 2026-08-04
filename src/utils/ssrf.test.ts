import { describe, expect, test } from "bun:test";
import { __resetRuntimeConfig, applyRuntimeConfig } from "@/config";
import { assertPublicHttpUrl, validateNavigationUrl } from "./ssrf";

describe("assertPublicHttpUrl", () => {
  test("allows public https", () => {
    expect(() => assertPublicHttpUrl("https://example.com")).not.toThrow();
  });

  test("blocks private hosts", () => {
    expect(() => assertPublicHttpUrl("http://localhost:3000")).toThrow(/Blocked/);
    expect(() => assertPublicHttpUrl("http://127.0.0.1")).toThrow(/Blocked/);
    expect(() => assertPublicHttpUrl("http://192.168.1.1")).toThrow(/Blocked/);
    expect(() => assertPublicHttpUrl("http://10.0.0.5/path")).toThrow(/Blocked/);
    expect(() => assertPublicHttpUrl("http://172.16.0.1")).toThrow(/Blocked/);
    expect(() => assertPublicHttpUrl("http://app.local")).toThrow(/Blocked/);
  });

  test("blocks non-http schemes", () => {
    expect(() => assertPublicHttpUrl("file:///etc/passwd")).toThrow(/http/);
  });
});

describe("validateNavigationUrl", () => {
  test("allows private when config override set", () => {
    applyRuntimeConfig({ allowPrivate: true });
    try {
      expect(() => validateNavigationUrl("http://localhost:8080")).not.toThrow();
    } finally {
      __resetRuntimeConfig();
    }
  });

  test("blocks private when config override off (default)", () => {
    __resetRuntimeConfig();
    expect(() => validateNavigationUrl("http://localhost:8080")).toThrow(/Blocked/);
  });
});
