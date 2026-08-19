/**
 * Anti-drift for documentation: a doc that points at a path which no longer exists
 * is worse than no doc, because an agent will follow it and then improvise.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import type { Finding } from "./lint.ts";

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage"]);

export function lintDocLinks(root: string): Finding[] {
  const findings: Finding[] = [];
  for (const file of markdownFiles(root)) {
    const rel = relative(root, file).split(sep).join("/");
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1]!;
      if (/^(https?:|mailto:|#|<)/.test(target)) continue;
      // `file:///` links only ever resolve on the author's machine. They are a trap
      // in a repo that gets cloned, so they are rejected outright.
      if (target.startsWith("file://")) {
        findings.push({ code: "D001", file: rel, severity: "error", message: `absolute file:// link '${target}' will not resolve outside one machine; use a repo-relative path` });
        continue;
      }
      const bare = target.split("#")[0]!;
      if (bare === "") continue;
      const resolved = bare.startsWith("/") ? join(root, bare.slice(1)) : resolve(file, "..", bare);
      if (!existsSync(resolved)) {
        findings.push({ code: "D001", file: rel, severity: "error", message: `link target does not exist: '${target}'` });
      }
    }
  }
  return findings;
}

function markdownFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const name of entries) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) walk(full);
      else if (name.endsWith(".md")) out.push(full);
    }
  };
  walk(root);
  return out;
}
