import type { z } from "zod";
import type { fetchInputSchema } from "@/schemas/fetch";

export type FetchInput = z.infer<typeof fetchInputSchema>;
