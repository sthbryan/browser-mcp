#!/usr/bin/env bun
/**
 * Create a release tag for @sthbryan/web-search-mcp.
 *
 * Usage:
 *   bun run release              # tag current package.json version
 *   bun run release patch        # 0.1.0 → 0.1.1
 *   bun run release minor        # 0.1.0 → 0.2.0
 *   bun run release major        # 0.1.0 → 1.0.0
 *   bun run release 0.1.0        # set exact version
 *   bun run release --no-push    # tag only, do not push
 *
 * After push of tag vX.Y.Z, GitHub Actions publishes to npm.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const pkgPath = join(root, "package.json");

function sh(cmd: string, opts?: { stdio?: "inherit" | "pipe" }): string {
  const result = execSync(cmd, {
    cwd: root,
    encoding: "utf8",
    stdio: opts?.stdio ?? "pipe",
  });
  return typeof result === "string" ? result.trim() : "";
}

function parseSemver(v: string): [number, number, number] {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) throw new Error(`Invalid semver: ${v}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function bumpVersion(current: string, kind: "patch" | "minor" | "major"): string {
  const [maj, min, pat] = parseSemver(current);
  if (kind === "major") return `${maj + 1}.0.0`;
  if (kind === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

const args = process.argv.slice(2).filter((a) => a !== "--");
const noPush = args.includes("--no-push");
const bumpArg = args.find((a) => a !== "--no-push");

const dirty = sh("git status --porcelain");
if (dirty) {
  console.error(`Working tree is dirty. Commit or stash first:\n${dirty}`);
  process.exit(1);
}

const branch = sh("git rev-parse --abbrev-ref HEAD");
if (branch !== "main") {
  console.error(`Must release from main (current: ${branch})`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
  name: string;
  version: string;
};

let next = pkg.version;
if (bumpArg) {
  if (bumpArg === "patch" || bumpArg === "minor" || bumpArg === "major") {
    next = bumpVersion(pkg.version, bumpArg);
  } else {
    parseSemver(bumpArg);
    next = bumpArg;
  }
}

if (next !== pkg.version) {
  pkg.version = next;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  sh("git add package.json", { stdio: "inherit" });
  sh(`git commit -m "chore: release v${next}"`, { stdio: "inherit" });
  console.log(`Bumped version ${pkg.version} → ${next} (committed)`);
} else {
  console.log(`Using package.json version ${next}`);
}

const tag = `v${next}`;
const existing = sh(`git tag -l ${tag}`);
if (existing) {
  console.error(`Tag ${tag} already exists`);
  process.exit(1);
}

console.log("Running check + test + build…");
sh("bun run check", { stdio: "inherit" });
sh("bun test", { stdio: "inherit" });
sh("bun run build", { stdio: "inherit" });

sh(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: "inherit" });
console.log(`Created tag ${tag}`);

if (noPush) {
  console.log("Skipped push (--no-push). Push with:\n  git push origin main --tags");
  process.exit(0);
}

console.log("Pushing main + tags…");
sh("git push origin main", { stdio: "inherit" });
sh("git push origin --tags", { stdio: "inherit" });
console.log(
  `\n✓ ${pkg.name}@${next} tagged.\n  GitHub Actions will publish to npm when CI passes.\n  https://www.npmjs.com/package/${pkg.name}`
);
