export type WaitUntilInput = "load" | "domcontentloaded" | "networkidle" | "commit";

export type PuppeteerWaitUntil = "load" | "domcontentloaded" | "networkidle0" | "networkidle2";

export function mapWaitUntil(waitUntil: WaitUntilInput | undefined): PuppeteerWaitUntil {
  switch (waitUntil) {
    case "domcontentloaded":
      return "domcontentloaded";
    case "networkidle":
      return "networkidle2";
    case "commit":
      return "domcontentloaded";
    case "load":
    default:
      return "load";
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
