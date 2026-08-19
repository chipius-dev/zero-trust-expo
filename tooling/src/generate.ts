/**
 * The single generator. One pass produces every derived artifact:
 *
 *   ROADMAP.md                          human dashboard
 *   backlog/index.json                  machine index ("what should I work on?")
 *   CLAUDE.md                           agent-surface pointer, derived from AGENTS.md
 *   .github/pull_request_template.md    derived from docs/definition-of-done.md
 *
 * Output is deterministic: stable sort order, and "as of" is a digest of the backlog's
 * own content rather than a wall clock or a commit sha, so an unchanged backlog
 * regenerates byte-identically and the freshness gate reports real drift only.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Backlog } from "./load.ts";
import { backlogDigest } from "./git.ts";
import { deriveAwaitingReview, lintGitReality, type Finding } from "./lint.ts";
import { GLYPH, OPEN_STATUSES, STATUSES, STATUS_LABEL, type Config, type Item, type Status } from "./model.ts";

export const GENERATED_BANNER = "<!-- GENERATED FILE - DO NOT EDIT. Run `make gen`. Source: backlog/items/*.md -->";

export interface GeneratedFile { path: string; content: string; }

export function generateAll(root: string, backlog: Backlog, config: Config): GeneratedFile[] {
  const drift = lintGitReality(root, backlog, config);
  const awaiting = deriveAwaitingReview(root, backlog, config);
  const files: GeneratedFile[] = [
    { path: "ROADMAP.md", content: renderDashboard(root, backlog, config, drift, awaiting) },
    { path: join("backlog", "index.json"), content: renderIndex(root, backlog, config, drift, awaiting) },
  ];
  const claude = renderAgentPointer(root);
  if (claude) files.push({ path: "CLAUDE.md", content: claude });
  const pr = renderPullRequestTemplate(root);
  if (pr) files.push({ path: join(".github", "pull_request_template.md"), content: pr });
  return files;
}

export function writeGenerated(root: string, files: GeneratedFile[]): string[] {
  const written: string[] = [];
  for (const file of files) {
    const full = join(root, file.path);
    mkdirSync(dirname(full), { recursive: true });
    const previous = existsSync(full) ? readFileSync(full, "utf8") : null;
    if (previous !== file.content) {
      writeFileSync(full, file.content);
      written.push(file.path);
    }
  }
  return written;
}

const byId = (a: Item, b: Item) => a.id.localeCompare(b.id);

function counts(backlog: Backlog): Record<Status, number> {
  const out = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const item of backlog.items) if (item.status in out) out[item.status]++;
  for (const row of backlog.archived) if (row.status in out) out[row.status]++;
  return out;
}

function esc(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * Markdown tables and ASCII glyphs only: no ANSI, no HTML, no wide unicode. This
 * gets pasted into chat windows and read on phones.
 */
export function renderDashboard(root: string, backlog: Backlog, config: Config, drift: Finding[], awaiting: Set<string>): string {
  const digest = backlogDigest(root);
  const tally = counts(backlog);
  const open = backlog.items.filter((i) => (OPEN_STATUSES as readonly Status[]).includes(i.status));
  const inFlight = open.filter((i) => i.status === "in_progress" || i.status === "blocked").sort(byId);
  // "Next up" means work, and work happens at story level: one story, one branch, one review.
  const ready = open.filter((i) => i.status === "ready" && i.type === "story").sort(byId);

  const out: string[] = [];
  out.push("# Roadmap");
  out.push("");
  out.push(GENERATED_BANNER);
  out.push("");
  out.push(`Backlog digest \`${digest}\`. This file changes only when the backlog changes.`);
  out.push("");
  out.push("## Summary");
  out.push("");
  out.push("| | State | Count |");
  out.push("| :-: | :--- | ---: |");
  for (const status of STATUSES) out.push(`| ${GLYPH[status]} | ${STATUS_LABEL[status]} | ${tally[status]} |`);
  out.push("");
  const wip = tally.in_progress;
  out.push(`WIP ${wip}/${config.wipLimit}${wip > config.wipLimit ? " - OVER LIMIT" : ""}. Open items ${open.length}, archived ${backlog.archived.length}.`);
  out.push("");

  out.push("## In flight");
  out.push("");
  if (inFlight.length === 0) {
    out.push("Nothing in progress.");
  } else {
    out.push("| | ID | Type | Title | Owner | Review | Blocked by |");
    out.push("| :-: | :--- | :--- | :--- | :--- | :-: | :--- |");
    const shown = inFlight.slice(0, config.dashboardMaxRows);
    for (const item of shown) {
      out.push(`| ${GLYPH[item.status]} | ${item.id} | ${item.type} | ${esc(item.title)} | ${item.owner ?? "-"} | ${awaiting.has(item.id) ? "yes" : "-"} | ${item.blockedBy.length ? esc(item.blockedBy.join(", ")) : "-"} |`);
    }
    if (inFlight.length > shown.length) {
      out.push(`| | | | _...${inFlight.length - shown.length} more, see \`backlog/index.json\`_ | | | |`);
    }
  }
  out.push("");

  out.push("## Next up");
  out.push("");
  if (ready.length === 0) {
    out.push("No items are `ready`. Author one with `make new-item`.");
  } else {
    out.push("| ID | Type | Title | Parent |");
    out.push("| :--- | :--- | :--- | :--- |");
    for (const item of ready.slice(0, 5)) out.push(`| ${item.id} | ${item.type} | ${esc(item.title)} | ${item.parent ?? "-"} |`);
    if (ready.length > 5) out.push(`| | | _...${ready.length - 5} more, see \`backlog/index.json\`_ | |`);
  }
  out.push("");

  out.push("## Status contradicting git");
  out.push("");
  if (drift.length === 0) {
    out.push("None. Stored status agrees with branches and commit trailers.");
  } else {
    out.push("| Code | Item | Detail |");
    out.push("| :--- | :--- | :--- |");
    for (const finding of [...drift].sort((a, b) => a.file.localeCompare(b.file) || a.code.localeCompare(b.code))) {
      out.push(`| ${finding.code} | ${esc(finding.file)} | ${esc(finding.message)} |`);
    }
  }
  out.push("");
  out.push("---");
  out.push("");
  out.push("Status truth lives in `backlog/items/*.md`. This file is derived; edit the items, then run `make gen`.");
  out.push("`Review` is derived from git (branch carries commits not on the default branch), never stored.");
  out.push("");
  return out.join("\n");
}

/** The cheap read. An agent asking "what is next?" loads this one small file. */
export function renderIndex(root: string, backlog: Backlog, config: Config, drift: Finding[], awaiting: Set<string>): string {
  const open = backlog.items.filter((i) => (OPEN_STATUSES as readonly Status[]).includes(i.status)).sort(byId);
  const payload = {
    schema: 1,
    asOf: { backlogDigest: backlogDigest(root) },
    counts: counts(backlog),
    wip: { inProgress: open.filter((i) => i.status === "in_progress").length, limit: config.wipLimit },
    next: open.filter((i) => i.status === "ready" && i.type === "story").map((i) => i.id),
    blocked: open.filter((i) => i.status === "blocked").map((i) => ({ id: i.id, blockedBy: i.blockedBy })),
    awaitingReview: [...awaiting].sort(),
    drift: drift.map((d) => ({ code: d.code, file: d.file, message: d.message })).sort((a, b) => a.file.localeCompare(b.file) || a.code.localeCompare(b.code)),
    open: open.map((i) => ({
      id: i.id, type: i.type, status: i.status, title: i.title,
      parent: i.parent ?? null, owner: i.owner ?? null, branch: i.branch ?? null,
      acceptance: i.acceptance, path: i.path,
    })),
    archivedCount: backlog.archived.length,
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

/**
 * Agent-surface pointer. Generated from AGENTS.md so the two can never drift:
 * the freshness gate fails if this file is edited by hand. Adding another surface
 * (Cursor, Copilot, ...) means adding a renderer here, not a second rules file.
 */
export function renderAgentPointer(root: string): string | null {
  const agentsPath = join(root, "AGENTS.md");
  if (!existsSync(agentsPath)) return null;
  const agents = readFileSync(agentsPath, "utf8");
  const firstHeading = /^#\s+(.+)$/m.exec(agents)?.[1] ?? "Agent instructions";
  return [
    GENERATED_BANNER,
    "",
    `# ${firstHeading}`,
    "",
    "This repository keeps one set of agent instructions, in `AGENTS.md`. Read it now;",
    "it is short by design. This file exists only because some agent surfaces look for",
    "`CLAUDE.md`, and it is regenerated from `AGENTS.md` by `make gen`.",
    "",
    "Start of every session:",
    "",
    "```bash",
    "make doctor   # are you current, and is the environment sane?",
    "make status   # what is in flight, what is next",
    "```",
    "",
    "Never hand-edit this file. Edit `AGENTS.md` and run `make gen`.",
    "",
  ].join("\n");
}

/** PR template derived from the Definition of Done, so the checklist has one home. */
export function renderPullRequestTemplate(root: string): string | null {
  const dodPath = join(root, "docs", "definition-of-done.md");
  if (!existsSync(dodPath)) return null;
  const dod = readFileSync(dodPath, "utf8");
  const checklist = dod.split("\n").filter((l) => /^- \[ \] /.test(l));
  return [
    GENERATED_BANNER,
    "",
    "## Item",
    "",
    "<!-- The item ID this PR closes, e.g. ITEM-0007. CI checks it against the backlog. -->",
    "",
    "## What changed",
    "",
    "## Definition of Done",
    "",
    ...(checklist.length ? checklist : ["- [ ] See docs/definition-of-done.md"]),
    "",
    "Most of the above is verified by `make ci`. Tick the rest honestly.",
    "",
  ].join("\n");
}
