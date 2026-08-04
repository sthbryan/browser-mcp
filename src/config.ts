/**
 * Runtime config resolved once at startup with precedence: CLI flag > env var > default.
 * Mutated via {@link applyRuntimeConfig} from src/index.ts after parsing CLI args.
 */

export interface RuntimeConfig {
  /** Allow downloading Chrome as last resort when no system browser is found. */
  allowDownload: boolean;
  /** Allow navigation to localhost / RFC1918 / .local (SSRF guard). */
  allowPrivate: boolean;
}

function readEnvBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined) return fallback;
  if (v === "0" || v === "false" || v === "no") return false;
  if (v === "1" || v === "true" || v === "yes") return true;
  return fallback;
}

function readEnvPrivate(): boolean {
  return process.env.BROWSER_MCP_ALLOW_PRIVATE === "1";
}

const DEFAULTS: RuntimeConfig = {
  allowDownload: true,
  allowPrivate: false,
};

let config: RuntimeConfig = {
  allowDownload: readEnvBool("BROWSER_MCP_ALLOW_DOWNLOAD", DEFAULTS.allowDownload),
  allowPrivate: readEnvPrivate(),
};

/** Override config values parsed from CLI flags. Only provided keys are replaced. */
export function applyRuntimeConfig(partial: Partial<RuntimeConfig>): void {
  config = { ...config, ...partial };
}

/** Current runtime config snapshot. */
export function getRuntimeConfig(): RuntimeConfig {
  return config;
}

/** Reset config from env vars + defaults. Test helper. */
export function __resetRuntimeConfig(): void {
  config = {
    allowDownload: readEnvBool("BROWSER_MCP_ALLOW_DOWNLOAD", DEFAULTS.allowDownload),
    allowPrivate: readEnvPrivate(),
  };
}
