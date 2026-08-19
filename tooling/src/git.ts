/** Everything the process derives from git. All of it works offline; no forge API. */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export function git(root: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

export function isRepo(root: string): boolean {
  return git(root, ["rev-parse", "--is-inside-work-tree"]) === "true";
}

export function currentBranch(root: string): string {
  return git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
}

/** Local and remote branch names, remote prefix stripped, deduplicated. */
export function allBranches(root: string): string[] {
  const raw = git(root, ["for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes"]);
  const names = raw ? raw.split("\n") : [];
  const cleaned = names
    .map((n) => n.replace(/^origin\//, ""))
    .filter((n) => n !== "" && n !== "HEAD" && !n.endsWith("/HEAD"));
  return [...new Set(cleaned)].sort();
}

/** Working tree clean? Used by the freshness gate. */
export function isClean(root: string): boolean {
  return git(root, ["status", "--porcelain"]) === "";
}

export function dirtyPaths(root: string): string[] {
  const raw = git(root, ["status", "--porcelain"]);
  return raw ? raw.split("\n").map((l) => l.slice(3)) : [];
}

/**
 * "As of" for the dashboard: a digest of the backlog's own content.
 *
 * The obvious choice is the last commit that touched backlog/, but it does not work:
 * committing an item and its regenerated dashboard together changes that commit, so
 * the freshly generated file would be stale the moment it landed and CI would fail on
 * every pull request. A content digest changes exactly when the backlog changes, which
 * is what "zero diff churn" actually requires. Anything wanting a wall-clock date reads
 * git at runtime instead - see `make status`.
 */
export function backlogDigest(root: string): string {
  const dir = join(root, "backlog");
  const hash = createHash("sha256");
  const walk = (current: string) => {
    let entries: string[];
    try { entries = readdirSync(current).sort(); } catch { return; }
    for (const name of entries) {
      if (name === "index.json") continue; // derived from the rest; would be self-referential
      const full = join(current, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) walk(full);
      else if (name.endsWith(".md")) {
        hash.update(relative(root, full).split(sep).join("/"));
        hash.update(readFileSync(full));
      }
    }
  };
  walk(dir);
  return hash.digest("hex").slice(0, 10);
}

/** Wall-clock date of the last commit touching the backlog. Runtime output only. */
export function backlogCommitDate(root: string): string {
  return git(root, ["log", "-1", "--format=%cs", "--", "backlog"]) || "uncommitted";
}

/** How far the local base is behind its upstream. -1 means "no upstream to compare". */
export function behindCount(root: string, defaultBranch: string): number {
  const remoteRef = `origin/${defaultBranch}`;
  if (git(root, ["rev-parse", "--verify", "--quiet", remoteRef]) === "") return -1;
  const raw = git(root, ["rev-list", "--count", `HEAD..${remoteRef}`]);
  return raw === "" ? -1 : Number(raw);
}

/** Commits carrying an `Item: <ID>` trailer, mapped ID -> commit count. */
export function itemCommitCounts(root: string): Map<string, number> {
  const raw = git(root, ["log", "--all", "--format=%B%x00"]);
  const counts = new Map<string, number>();
  for (const message of raw.split("\0")) {
    const m = /^\s*Item:\s*([A-Z]+-\d{4})\s*$/m.exec(message);
    if (!m) continue;
    counts.set(m[1]!, (counts.get(m[1]!) ?? 0) + 1);
  }
  return counts;
}

/** Branch carrying commits not yet on the default branch => the work is out for review. */
export function branchIsAhead(root: string, branch: string, defaultBranch: string): boolean {
  const ref = git(root, ["rev-parse", "--verify", "--quiet", branch]) !== "" ? branch : `origin/${branch}`;
  if (git(root, ["rev-parse", "--verify", "--quiet", ref]) === "") return false;
  const base = git(root, ["rev-parse", "--verify", "--quiet", `origin/${defaultBranch}`]) !== ""
    ? `origin/${defaultBranch}` : defaultBranch;
  const raw = git(root, ["rev-list", "--count", `${base}..${ref}`]);
  return raw !== "" && Number(raw) > 0;
}
