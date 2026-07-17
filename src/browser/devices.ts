/**
 * Viewport / device templates for screenshot and page tools.
 */

export type DeviceTemplate = "mobile" | "tablet" | "desktop" | "custom";

export interface ViewportSpec {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  userAgent?: string;
}

/** Realistic Chrome UA — avoids Playwright's default HeadlessChrome fingerprint. */
export const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Common presets (logical CSS pixels). */
export const DEVICE_TEMPLATES: Record<Exclude<DeviceTemplate, "custom">, ViewportSpec> = {
  mobile: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  tablet: {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  desktop: {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent: DESKTOP_USER_AGENT,
  },
};

export function resolveViewport(opts: {
  template?: DeviceTemplate;
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
}): ViewportSpec {
  const template = opts.template ?? "desktop";

  if (template === "custom") {
    if (!opts.width || !opts.height) {
      throw new Error("template=custom requires width and height");
    }
    return {
      width: opts.width,
      height: opts.height,
      deviceScaleFactor: opts.deviceScaleFactor ?? 1,
      isMobile: opts.width < 768,
      hasTouch: opts.width < 1024,
      userAgent: DESKTOP_USER_AGENT,
    };
  }

  const base = DEVICE_TEMPLATES[template];
  return {
    ...base,
    width: opts.width ?? base.width,
    height: opts.height ?? base.height,
    deviceScaleFactor: opts.deviceScaleFactor ?? base.deviceScaleFactor,
  };
}
