import { z } from "zod";

export const screenshotInputSchema = z
  .object({
    url: z.string().url().describe("Page URL to capture"),
    template: z
      .enum(["mobile", "tablet", "desktop", "custom"])
      .default("desktop")
      .describe("Device viewport preset. Use custom with width/height."),
    width: z.number().int().min(1).max(7680).optional().describe("Viewport width override (px)"),
    height: z.number().int().min(1).max(4320).optional().describe("Viewport height override (px)"),
    fullPage: z
      .boolean()
      .default(false)
      .describe("Capture full scrollable page instead of viewport only"),
    format: z.enum(["png", "jpeg"]).default("png"),
    quality: z.number().int().min(1).max(100).optional().describe("JPEG quality 1–100 (jpeg only)"),
    deviceScaleFactor: z
      .number()
      .min(0.5)
      .max(3)
      .optional()
      .describe("Device pixel ratio (default from template)"),
    darkMode: z.boolean().default(false).describe("Emulate prefers-color-scheme: dark"),
    waitUntil: z
      .enum(["load", "domcontentloaded", "networkidle", "commit"])
      .default("load")
      .describe("Navigation wait condition"),
    selector: z
      .string()
      .optional()
      .describe("Optional CSS selector — screenshot that element only"),
  })
  .superRefine((val, ctx) => {
    if (val.template === "custom" && (val.width == null || val.height == null)) {
      ctx.addIssue({
        code: "custom",
        message: "template=custom requires both width and height",
        path: ["width"],
      });
    }
    if (val.format === "png" && val.quality != null) {
      ctx.addIssue({
        code: "custom",
        message: "quality only applies to jpeg",
        path: ["quality"],
      });
    }
  });
