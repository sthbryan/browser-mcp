import type { z } from "zod";
import type { screenshotInputSchema } from "@/schemas/screenshot";

export type ScreenshotInput = z.infer<typeof screenshotInputSchema>;
