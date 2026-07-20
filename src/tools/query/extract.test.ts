import { describe, expect, test } from "bun:test";
import { applyLimit, dedupeStrings, filterByText, finalizeMatches } from "./extract";

describe("dedupeStrings", () => {
  test("preserves order and drops duplicates", () => {
    expect(dedupeStrings(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  test("trims and drops empties", () => {
    expect(dedupeStrings(["  x  ", "", "  ", "x"])).toEqual(["x"]);
  });
});

describe("filterByText", () => {
  test("case-insensitive substring", () => {
    expect(filterByText(["Hello World", "goodbye"], "hello")).toEqual(["Hello World"]);
  });

  test("no needle keeps all", () => {
    expect(filterByText(["a", "b"], undefined)).toEqual(["a", "b"]);
    expect(filterByText(["a", "b"], "")).toEqual(["a", "b"]);
  });
});

describe("applyLimit", () => {
  test("slices", () => {
    expect(applyLimit(["a", "b", "c"], 2)).toEqual(["a", "b"]);
  });
});

describe("finalizeMatches", () => {
  test("full pipeline", () => {
    const raw = ["  Price: $10  ", null, "Price: $10", "Other", "Price: $20", undefined, ""];
    expect(finalizeMatches(raw, { text: "price", limit: 10 })).toEqual([
      "Price: $10",
      "Price: $20",
    ]);
  });

  test("respects limit after filter", () => {
    const raw = ["match 1", "match 2", "match 3", "nope"];
    expect(finalizeMatches(raw, { text: "match", limit: 2 })).toEqual(["match 1", "match 2"]);
  });
});
