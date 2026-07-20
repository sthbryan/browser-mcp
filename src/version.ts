import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/**
 * package.json version (src/ or dist/ → ../package.json).
 * Single source of truth for release bumps.
 */
export function getPackageVersion(): string {
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
  const pkg = require(pkgPath) as { version?: string };
  if (!pkg.version) {
    throw new Error(`Missing version in ${pkgPath}`);
  }
  return pkg.version;
}

export const VERSION = getPackageVersion();
