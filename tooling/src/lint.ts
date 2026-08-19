/**
 * The backlog schema linter. Every rule here replaces a paragraph of instruction
 * that an agent could ignore. Each finding has a stable code so it can be cited.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import type { Backlog } from "./load.ts";
import { allBranches, itemCommitCounts, branchIsAhead } from "./git.ts";
import {
  CLOSED_STATUSES, KEY_ORDER, PARENT_OF, REQUIRED_KEYS, REQUIRED_SECTIONS,
  STATUSES, TYPES, VAGUE_TERMS, branchPattern, idPattern, type Config, type Item, type Status,
} from "./model.ts";
import { parseFrontMatter } from "./frontmatter.ts";

export interface Finding { code: string; file: string; message: string; severity: "error" | "warn"; }

const err = (code: string, file: string, message: string): Finding => ({ code, file, message, severity: "error" });
const warn = (code: string, file: string, message: string): Finding => ({ code, file, message, severity: "warn" });

/** Statuses at or beyond `ready` must satisfy the full authoring checklist. */
function isReadyOrBeyond(status: Status): boolean {
  return status === "ready" || status === "in_progress" || status === "blocked" || status === "done";
}

export function lintBacklog(root: string, backlog: Backlog, config: Config): Finding[] {
  const findings: Finding[] = [];
  const ID_RE = idPattern(config.idPrefix);

  for (const issue of backlog.issues) findings.push(err("L000", issue.file, `front matter: ${issue.message}`));

  const seen = new Map<string, string>();
  const byId = new Map<string, Item>();
  for (const item of [...backlog.items, ...backlog.archived]) if (item.id) byId.set(item.id, item);

  for (const item of backlog.items) {
    const file = item.path!;
    const raw = readFileSync(join(root, file), "utf8");
    const parsed = parseFrontMatter(raw);

    // L001 filename is the ID, so a path alone identifies an item.
    if (basename(file, ".md") !== item.id) findings.push(err("L001", file, `filename must match id '${item.id}'`));

    // L002 / L003 stable, unique, never-reused IDs.
    if (!ID_RE.test(item.id)) findings.push(err("L002", file, `id '${item.id}' must match ${ID_RE.source}`));
    const prior = seen.get(item.id);
    if (prior) findings.push(err("L003", file, `duplicate id '${item.id}', already used by ${prior}`));
    seen.set(item.id, file);
    if (backlog.archived.some((a) => a.id === item.id)) {
      findings.push(err("L003", file, `id '${item.id}' is already archived and must never be reused`));
    }

    // L017 closed schema: unknown keys are a failure, not a shrug.
    for (const key of Object.keys(parsed.data)) {
      if (!(KEY_ORDER as readonly string[]).includes(key)) findings.push(err("L017", file, `unknown front-matter key '${key}'`));
    }
    for (const key of REQUIRED_KEYS) {
      if (!(key in parsed.data)) findings.push(err("L004", file, `missing required front-matter key '${key}'`));
    }

    // L005 closed enums.
    if (!(TYPES as readonly string[]).includes(item.type)) findings.push(err("L005", file, `type '${item.type}' is not one of ${TYPES.join(", ")}`));
    if (!(STATUSES as readonly string[]).includes(item.status)) findings.push(err("L005", file, `status '${item.status}' is not one of ${STATUSES.join(", ")}`));

    // L006 explicit parentage, one level at a time.
    const expectedParent = PARENT_OF[item.type];
    if (expectedParent === null && item.parent) findings.push(err("L006", file, "an initiative must not declare a parent"));
    if (item.type === "story" && !item.parent) findings.push(err("L006", file, "a story must declare 'parent' (its epic)"));
    if (item.parent) {
      const parent = byId.get(item.parent);
      if (item.parent === item.id) findings.push(err("L006", file, "item cannot be its own parent"));
      else if (!parent) findings.push(err("L006", file, `parent '${item.parent}' does not exist`));
      else if (expectedParent && parent.type !== expectedParent) findings.push(err("L006", file, `parent '${item.parent}' is a ${parent.type}; a ${item.type} must have a ${expectedParent} parent`));
    }

    // L007 / L008 basic hygiene the dashboard depends on.
    if (!item.title || item.title.length > 80) findings.push(err("L007", file, `title must be 1-80 characters (found ${item.title.length})`));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.created)) findings.push(err("L008", file, `created must be an ISO date (YYYY-MM-DD), found '${item.created}'`));

    // L009 the grill-me gate: an item may not reach 'ready' while it is still vague.
    if (isReadyOrBeyond(item.status)) {
      for (const section of REQUIRED_SECTIONS) {
        if (!item.body.includes(`\n${section}`) && !item.body.startsWith(section)) {
          findings.push(err("L009", file, `status '${item.status}' requires body section '${section}' (see backlog/SCHEMA.md)`));
        }
      }
      if (bulletCount(extractSection(item.body, "## Out of scope")) < 1) {
        findings.push(err("L009", file, "'## Out of scope' must name at least one thing this item will NOT do"));
      }
      if (bulletCount(extractSection(item.body, "## Decisions and rejected alternatives")) < 1) {
        findings.push(err("L009", file, "'## Decisions and rejected alternatives' must record at least one decision with the alternative rejected and why"));
      }
    }

    // L010 acceptance criteria must be capable of failing.
    if (isReadyOrBeyond(item.status) && item.type === "story" && item.acceptance.length === 0) {
      findings.push(err("L010", file, `a story at status '${item.status}' needs at least one acceptance criterion`));
    }
    // Draft is the one status where an item is allowed to still be vague: that is
    // what "not yet interrogated" means. Everything past it must be falsifiable.
    for (const criterion of isReadyOrBeyond(item.status) ? item.acceptance : []) {
      const lower = criterion.toLowerCase();
      const vague = VAGUE_TERMS.find((t) => lower.includes(t));
      if (vague) findings.push(err("L010", file, `acceptance criterion contains unfalsifiable term '${vague}': ${JSON.stringify(criterion)}`));
      if (!lower.includes("should")) findings.push(err("L010", file, `acceptance criterion must read as a test name containing 'should': ${JSON.stringify(criterion)}`));
      if (criterion.trim().split(/\s+/).length < 5) findings.push(err("L010", file, `acceptance criterion is too short to name a test: ${JSON.stringify(criterion)}`));
    }

    // L011 / L012 closing an item honestly.
    if (item.status === "blocked" && item.blockedBy.length === 0) findings.push(err("L011", file, "status 'blocked' requires 'blocked_by' naming the blocker"));
    if (item.status === "dropped" && !item.droppedReason) findings.push(err("L012", file, "status 'dropped' requires 'dropped_reason' (drop items, never delete them)"));

    // L013 the context record is a briefing, not a transcript.
    const bodyLines = item.body.split("\n").length;
    if (bodyLines > config.maxContextLines) findings.push(err("L013", file, `context record is ${bodyLines} lines, over the ${config.maxContextLines}-line cap`));

    // L015 closed items belong in the archive rollup.
    if ((CLOSED_STATUSES as readonly Status[]).includes(item.status)) {
      findings.push(err("L015", file, `status '${item.status}' must be archived: run 'make archive ID=${item.id}'`));
    }

    // L019 in-flight work has an owner, so "who is on this?" is answerable.
    if (item.status === "in_progress" && !item.owner) findings.push(err("L019", file, "status 'in_progress' requires 'owner' (human handle or agent name)"));

    // L020 the branch/ID linkage everything else derives from.
    if (item.branch) {
      if (!branchPattern(config.idPrefix).test(item.branch)) findings.push(err("L020", file, `branch '${item.branch}' must match ${branchPattern(config.idPrefix).source}`));
      else if (!item.branch.includes(item.id)) findings.push(err("L020", file, `branch '${item.branch}' must carry this item's id`));
    }
  }

  // L018 WIP limit: a limit nobody counts is not a limit.
  const inFlight = backlog.items.filter((i) => i.status === "in_progress");
  if (inFlight.length > config.wipLimit) {
    findings.push(err("L018", "backlog/", `${inFlight.length} items in progress, over the WIP limit of ${config.wipLimit}: ${inFlight.map((i) => i.id).join(", ")}`));
  }

  findings.push(...lintArchive(backlog, config));
  findings.push(...lintAcceptanceTestsExist(root, backlog, config));
  return findings;
}

function lintArchive(backlog: Backlog, config: Config): Finding[] {
  const findings: Finding[] = [];
  const ID_RE = idPattern(config.idPrefix);
  const seen = new Set<string>();
  for (const row of backlog.archived) {
    const file = row.path!;
    if (!ID_RE.test(row.id)) findings.push(err("L002", file, `archived id '${row.id}' must match ${ID_RE.source}`));
    if (seen.has(row.id)) findings.push(err("L003", file, `duplicate archived id '${row.id}'`));
    seen.add(row.id);
    if (!(CLOSED_STATUSES as readonly string[]).includes(row.status)) {
      findings.push(err("L016", file, `archived item '${row.id}' has non-closed status '${row.status}'`));
    }
    if (row.status === "dropped" && !row.droppedReason) {
      findings.push(err("L012", file, `dropped item '${row.id}' must record a reason in the note column`));
    }
  }
  return findings;
}

/**
 * L014 - the strongest honest link between "done" and reality: an item may not be
 * closed as done unless every acceptance criterion exists as a real test name in
 * the repo. Substring-based on purpose, so it works for any language.
 */
export function lintAcceptanceTestsExist(root: string, backlog: Backlog, config: Config): Finding[] {
  const findings: Finding[] = [];
  const done = backlog.items.filter((i) => i.status === "done" && i.acceptance.length > 0);
  if (done.length === 0) return findings;
  const haystack = readTestCorpus(root, config);
  for (const item of done) {
    for (const criterion of item.acceptance) {
      if (!haystack.includes(criterion)) {
        findings.push(err("L014", item.path!, `acceptance criterion has no matching test in ${config.testGlobs.join(", ")}: ${JSON.stringify(criterion)}`));
      }
    }
  }
  return findings;
}

/** Cheap glob: walk the tree once, keep files whose repo-relative path matches a pattern. */
function readTestCorpus(root: string, config: Config): string {
  const matchers = config.testGlobs.map(globToRegExp);
  const chunks: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const name of entries) {
      if (name === ".git" || name === "node_modules" || name === "dist") continue;
      const full = join(dir, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) { walk(full); continue; }
      const rel = relative(root, full).split(sep).join("/");
      if (matchers.some((re) => re.test(rel))) {
        try { chunks.push(readFileSync(full, "utf8")); } catch { /* unreadable file is not a lint concern */ }
      }
    }
  };
  walk(root);
  return chunks.join("\n");
}

function globToRegExp(glob: string): RegExp {
  const DOUBLESTAR = "\u0001";
  const body = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, DOUBLESTAR)
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".")
    .split(DOUBLESTAR)
    .join("(?:.*/)?");
  return new RegExp(`^${body}$`);
}

/** Findings that come from comparing stored status against what git actually shows. */
export function lintGitReality(root: string, backlog: Backlog, config: Config): Finding[] {
  const findings: Finding[] = [];
  const branches = allBranches(root);
  const commits = itemCommitCounts(root);

  for (const item of backlog.items) {
    const file = item.path!;
    const itemBranches = branches.filter((b) => b.includes(item.id));

    if (item.status === "in_progress" && itemBranches.length === 0) {
      findings.push(warn("G001", file, `status is 'in_progress' but no branch carries '${item.id}'`));
    }
    if (item.status === "in_progress" && (commits.get(item.id) ?? 0) === 0) {
      findings.push(warn("G002", file, `status is 'in_progress' but no commit carries the trailer 'Item: ${item.id}'`));
    }
    for (const blocker of item.blockedBy) {
      if (idPattern(config.idPrefix).test(blocker) && !backlog.items.some((i) => i.id === blocker) && !backlog.archived.some((i) => i.id === blocker)) {
        findings.push(warn("G004", file, `blocked_by references unknown item '${blocker}'`));
      }
    }
  }

  for (const row of backlog.archived) {
    if (row.status !== "done") continue;
    for (const branch of branches.filter((b) => b.includes(row.id) && b !== config.defaultBranch)) {
      if (branchIsAhead(root, branch, config.defaultBranch)) {
        findings.push(warn("G003", row.path!, `'${row.id}' is done but branch '${branch}' still has unmerged commits`));
      }
    }
  }
  return findings;
}

/** Items whose work is out for review. Derived from git, never stored. */
export function deriveAwaitingReview(root: string, backlog: Backlog, config: Config): Set<string> {
  const out = new Set<string>();
  const branches = allBranches(root);
  for (const item of backlog.items) {
    if (item.status !== "in_progress") continue;
    const branch = item.branch ?? branches.find((b) => b.includes(item.id));
    if (branch && branchIsAhead(root, branch, config.defaultBranch)) out.add(item.id);
  }
  return out;
}

function extractSection(body: string, heading: string): string {
  const idx = body.indexOf(heading);
  if (idx === -1) return "";
  const rest = body.slice(idx + heading.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

/** Counts real bullets, ignoring unfilled template placeholders like "- [ ]". */
function bulletCount(section: string): number {
  return section.split("\n").filter((l) => /^\s*[-*] \S/.test(l) && !/^\s*[-*] \[[^\]]*\]\s*$/.test(l)).length;
}

export function hasErrors(findings: Finding[]): boolean {
  return findings.some((f) => f.severity === "error");
}

export function formatFindings(findings: Finding[]): string {
  if (findings.length === 0) return "";
  const order = { error: 0, warn: 1 } as const;
  return [...findings]
    .sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.code.localeCompare(b.code))
    .map((f) => `  ${f.severity === "error" ? "ERROR" : "warn "} ${f.code} ${f.file}: ${f.message}`)
    .join("\n");
}
