import { z } from "zod";

export const queryInputSchema = z
  .object({
    url: z.string().url().describe("Page URL to query after JS render"),
    selector: z
      .string()
      .min(1)
      .optional()
      .describe("CSS selector — extract matching elements (e.g. h1, .price, a.cta)"),
    text: z
      .string()
      .min(1)
      .optional()
      .describe("Filter matches that contain this text (case-insensitive)"),
    attribute: z
      .string()
      .min(1)
      .optional()
      .describe(
        "If set, extract this HTML attribute instead of textContent (e.g. href, src, data-id)"
      ),
    limit: z.number().int().min(1).max(200).default(50).describe("Max number of matches to return"),
    template: z
      .enum(["mobile", "tablet", "desktop", "custom"])
      .default("desktop")
      .describe("Viewport preset used while rendering"),
    width: z.number().int().min(1).max(7680).optional(),
    height: z.number().int().min(1).max(4320).optional(),
    waitUntil: z
      .enum(["load", "domcontentloaded", "networkidle", "commit"])
      .default("load")
      .describe("Playwright navigation wait condition"),
    waitFor: z
      .string()
      .min(1)
      .optional()
      .describe("Optional CSS selector to wait for before extracting (fails if missing)"),
  })
  .superRefine((val, ctx) => {
    if (!val.selector && !val.text) {
      ctx.addIssue({
        code: "custom",
        message: "Either 'selector' or 'text' must be provided",
        path: ["selector"],
      });
    }
    if (val.template === "custom" && (val.width == null || val.height == null)) {
      ctx.addIssue({
        code: "custom",
        message: "template=custom requires both width and height",
        path: ["width"],
      });
    }
    if (val.attribute && !val.selector) {
      ctx.addIssue({
        code: "custom",
        message: "attribute requires a selector",
        path: ["attribute"],
      });
    }
  });
