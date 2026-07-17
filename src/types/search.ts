import type { z } from "zod";
import type { searchInputSchema } from "@/schemas/search";

export type SearchInput = z.infer<typeof searchInputSchema>;

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}
