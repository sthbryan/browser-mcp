import { z } from "zod";

export const searchInputSchema = z.object({
  query: z.string().min(1).describe("Search query"),
  limit: z.number().int().min(1).max(20).default(10).describe("Max results (1–20)"),
});
