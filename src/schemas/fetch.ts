import { z } from "zod";

export const fetchInputSchema = z.object({
  url: z.string().url().describe("Page URL to fetch after JS render"),
  type: z
    .enum(["html", "markdown", "text"])
    .default("markdown")
    .describe("Output format"),
  template: z
    .enum(["mobile", "tablet", "desktop", "custom"])
    .default("desktop")
    .describe("Viewport preset used while rendering"),
  width: z.number().int().min(1).max(7680).optional(),
  height: z.number().int().min(1).max(4320).optional(),
  waitUntil: z
    .enum(["load", "domcontentloaded", "networkidle", "commit"])
    .default("load"),
});
