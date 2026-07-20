import type { z } from "zod";
import type { queryInputSchema } from "@/schemas/query";

export type QueryInput = z.infer<typeof queryInputSchema>;

export interface QueryMatchPayload {
  url: string;
  finalUrl: string;
  title: string;
  source: "puppeteer";
  selector: string | null;
  selector_used: string;
  text: string | null;
  attribute: string | null;
  count: number;
  result: string[];
  timestamp: string;
}
