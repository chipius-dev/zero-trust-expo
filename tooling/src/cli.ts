#!/usr/bin/env node
/**
 * One entrypoint for every process command. The Makefile is a thin wrapper over
 * this file, and CI calls the same Makefile targets, so a green local run and a
 * green CI run cannot mean different things.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { loadBacklog, highWaterMark, formatId, ITEMS_DIR, ARCHIVE_DIR } from "./load.ts";
import { lintBacklog, lintGitReality, formatFindings, hasErrors } from "./lint.ts";
import { generateAll, writeGenerated } from "./generate.ts";
import { lintDocLinks } from "./docs.ts";
import { loadConfig, GLYPH, STATUSES, TYPES, PARENT_OF, branchPattern, idPattern, type ItemType } from "./model.ts";
import { backlogDigest, backlogCommitDate, behindCount, currentBranch, isRepo, dirtyPaths } from "./git.ts";

const ROOT = process.env.SDLC_ROOT ?? process.cwd();
const config = loadConfig(ROOT);

function fail(message: string): never {
  console.error(`\nFAILED: ${message}\n`);
  process.exit(1);
}

function ok(message: string): void {
  console.log(`OK: ${message}`);
}

// --------------------------------------------------------------------------- status

function cmdStatus(): void {
  const indexPath = join(ROOT, "backlog", "index.json");
  if (!existsSync(indexPath)) fail("backlog/index.json is missing. Run `make gen`.");
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const digest = backlogDigest(ROOT);
  if (index.asOf.backlogDigest !== digest) {
    console.log(`(stale index: generated for ${index.asOf.backlogDigest}, backlog is now ${digest} - run \`make gen\`)`);
  }
  console.log(`Backlog ${digest}, last committed ${backlogCommitDate(ROOT)}`);
  console.log(STATUSES.map((s) => `${GLYPH[s]} ${s}:${index.counts[s]}`).join("  "));
  console.log(`WIP ${index.wip.inProgress}/${index.wip.limit}`);
  for (const item of index.open.filter((i: { status: string }) => i.status === "in_progress" || i.status === "blocked")) {
    const review = index.awaitingReview.includes(item.id) ? " [awaiting review]" : "";
    console.log(`  ${GLYPH[item.status as keyof typeof GLYPH]} ${item.id} ${item.title} (${item.owner ?? "unowned"})${review}`);
  }
  const next = index.next.slice(0, 3);
  console.log(next.length ? `Next: ${next.join(", ")}` : "Next: nothing ready - author an item with `make new-item`");
  if (index.drift.length) console.log(`Drift: ${index.drift.length} finding(s), see ROADMAP.md`);
}

// --------------------------------------------------------------------------- gen / check

function cmdGen(): void {
  const backlog = loadBacklog(ROOT);
  const written = writeGenerated(ROOT, generateAll(ROOT, backlog, config));
  console.log(written.length ? `Regenerated: ${written.join(", ")}` : "Already up to date.");
}

/** Freshness gate: derived artifacts must match what the generator produces right now. */
function cmdCheckFresh(): void {
  const backlog = loadBacklog(ROOT);
  const stale: string[] = [];
  for (const file of generateAll(ROOT, backlog, config)) {
    const full = join(ROOT, file.path);
    const onDisk = existsSync(full) ? readFileSync(full, "utf8") : null;
    if (onDisk !== file.content) stale.push(file.path);
  }
  if (stale.length) {
    fail(`generated files are stale or hand-edited: ${stale.join(", ")}\n  Fix: run \`make gen\` and commit the result. Never edit these by hand.`);
  }
  ok("generated artifacts are current");
}

function cmdLint(): void {
  const backlog = loadBacklog(ROOT);
  const findings = [...lintBacklog(ROOT, backlog, config), ...lintGitReality(ROOT, backlog, config), ...lintDocLinks(ROOT)];
  if (findings.length) console.log(formatFindings(findings));
  if (hasErrors(findings)) fail(`${findings.filter((f) => f.severity === "error").length} backlog error(s). See backlog/SCHEMA.md.`);
  ok(`backlog schema clean (${backlog.items.length} open, ${backlog.archived.length} archived, ${findings.length} warning(s))`);
}

// --------------------------------------------------------------------------- new-item

const GRILL = `
Before this item may move from 'draft' to 'ready', interrogate the requester.
Do not accept the first answer. Refuse to write a vague item.

  1. What breaks today, for whom, and how do you know?
  2. What is the observable outcome? Name the test that would prove it.
  3. What is explicitly OUT of scope? (at least one thing, or the item is not scoped)
  4. What happens on the failure paths: empty input, timeout, concurrent writer, permission denied?
  5. What did you consider and reject, and why? (this is the record that survives the chat)
  6. What existing code, ADR, or earlier item does this touch?
  7. Can one person land this in one branch and one review? If not, split it.

Then fill every '## ' section and at least one acceptance criterion, and set status: ready.
'make lint' will reject the item until you do.
`.trim();

function cmdNewItem(args: Record<string, string>): void {
  const type = (args.type ?? "story") as ItemType;
  if (!(TYPES as readonly string[]).includes(type)) fail(`TYPE must be one of ${TYPES.join(", ")}`);
  const title = args.title;
  if (!title) fail('TITLE is required, e.g. `make new-item TYPE=story TITLE="Reject expired tokens"`');
  if (title.length > 80) fail(`TITLE must be 80 characters or fewer (got ${title.length})`);

  const backlog = loadBacklog(ROOT);
  const parent = args.parent;
  const expectedParent = PARENT_OF[type];
  if (type === "story" && !parent) fail("PARENT is required for a story (the epic it belongs to)");
  if (parent) {
    if (!idPattern(config.idPrefix).test(parent)) fail(`PARENT '${parent}' is not a valid id`);
    const found = [...backlog.items, ...backlog.archived].find((i) => i.id === parent);
    if (!found) fail(`PARENT '${parent}' does not exist`);
    if (expectedParent && found.type !== expectedParent) fail(`a ${type} needs a ${expectedParent} parent, but '${parent}' is a ${found.type}`);
  }

  const id = formatId(config.idPrefix, highWaterMark(backlog, config.idPrefix) + 1);
  const path = join(ITEMS_DIR, `${id}.md`);
  if (existsSync(join(ROOT, path))) fail(`${path} already exists`);

  const front = [
    "---",
    `id: ${id}`,
    `title: ${JSON.stringify(title)}`,
    `type: ${type}`,
    "status: draft",
    `created: ${todayIso()}`,
    ...(parent ? [`parent: ${parent}`] : []),
    "acceptance:",
    '  - "should ... when ..."',
    "---",
  ].join("\n");

  const body = [
    "",
    `# ${id}: ${title}`,
    "",
    "## Why",
    "",
    "<!-- What breaks today, for whom, and how do we know. Not a restatement of the title. -->",
    "",
    "## Scope",
    "",
    "- ",
    "",
    "## Out of scope",
    "",
    "- ",
    "",
    "## Constraints",
    "",
    "- ",
    "",
    "## Decisions and rejected alternatives",
    "",
    "- Chose X over Y because Z.",
    "",
    "## Links",
    "",
    "- ",
    "",
  ].join("\n");

  mkdirSync(join(ROOT, ITEMS_DIR), { recursive: true });
  writeFileSync(join(ROOT, path), `${front}\n${body}`);
  console.log(`Created ${path} at status 'draft'.\n`);
  console.log(GRILL);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// --------------------------------------------------------------------------- archive

function cmdArchive(args: Record<string, string>): void {
  const id = args.id;
  if (!id) fail('ID is required, e.g. `make archive ID=ITEM-0007`');
  const backlog = loadBacklog(ROOT);
  const item = backlog.items.find((i) => i.id === id);
  if (!item) fail(`no live item '${id}' in ${ITEMS_DIR}`);
  if (item.status !== "done" && item.status !== "dropped") {
    fail(`only 'done' or 'dropped' items are archived; '${id}' is '${item.status}'`);
  }
  if (item.status === "dropped" && !item.droppedReason) fail(`'${id}' is dropped but has no dropped_reason`);

  const year = todayIso().slice(0, 4);
  const archivePath = join(ROOT, ARCHIVE_DIR, `${year}.md`);
  mkdirSync(join(ROOT, ARCHIVE_DIR), { recursive: true });
  if (!existsSync(archivePath)) {
    writeFileSync(archivePath, [
      `# Archive ${year}`,
      "",
      "Closed items roll up here so IDs are never reused and closed work stays countable",
      "without loading the whole backlog. Full context stays recoverable from git history.",
      "",
      "| ID | Type | Title | Final status | Closed | Note |",
      "| :--- | :--- | :--- | :--- | :--- | :--- |",
      "",
    ].join("\n"));
  }
  const note = item.status === "dropped" ? item.droppedReason! : (item.branch ?? "-");
  const row = `| ${item.id} | ${item.type} | ${item.title.replace(/\|/g, "\\|")} | ${item.status} | ${todayIso()} | ${note.replace(/\|/g, "\\|")} |\n`;
  const existing = readFileSync(archivePath, "utf8");
  writeFileSync(archivePath, existing.endsWith("\n") ? existing + row : `${existing}\n${row}`);
  unlinkSync(join(ROOT, item.path!));
  console.log(`Archived ${id} into ${ARCHIVE_DIR}/${year}.md and removed ${item.path}.`);
  cmdGen();
}

// --------------------------------------------------------------------------- doctor

function cmdDoctor(): void {
  let problems = 0;
  const note = (good: boolean, message: string, hint?: string) => {
    console.log(`  ${good ? "ok  " : "WARN"} ${message}`);
    if (!good && hint) console.log(`       -> ${hint}`);
    if (!good) problems++;
  };

  console.log("Environment");
  const major = Number(process.versions.node.split(".")[0]);
  const minor = Number(process.versions.node.split(".")[1]);
  note(major > 22 || (major === 22 && minor >= 18), `node ${process.versions.node} (need >= 22.18 for native TypeScript)`,
    "install Node 22.18+ or 24+; the tooling runs .ts directly with no build step");

  console.log("Git");
  if (!isRepo(ROOT)) {
    note(false, "not a git repository", "run `git init`");
  } else {
    const branch = currentBranch(ROOT);
    note(branch !== config.defaultBranch, `on branch '${branch}'`, `never commit to ${config.defaultBranch}; run \`make start ID=ITEM-XXXX\``);
    const behind = behindCount(ROOT, config.defaultBranch);
    if (behind < 0) note(true, `no origin/${config.defaultBranch} to compare against (offline or fresh repo)`);
    else note(behind === 0, `${behind} commit(s) behind origin/${config.defaultBranch}`, `run \`git fetch origin ${config.defaultBranch}\` and rebase or merge before you plan anything`);
    const dirty = dirtyPaths(ROOT);
    note(true, `${dirty.length} uncommitted path(s)`);
  }

  console.log("Process");
  note(existsSync(join(ROOT, "backlog", "index.json")), "backlog/index.json present", "run `make gen`");
  const backlog = loadBacklog(ROOT);
  const wip = backlog.items.filter((i) => i.status === "in_progress").length;
  note(wip <= config.wipLimit, `WIP ${wip}/${config.wipLimit}`, "finish or drop something before starting more");
  note(existsSync(join(ROOT, ".git", "hooks", "pre-push")) || process.env.CI === "true",
    "pre-push guard installed", "run `make hooks` (client-side guard; CI enforces the same rules regardless)");

  console.log("Forge");
  console.log("  ??   branch protection on the default branch cannot be verified offline.");
  console.log("       -> apply .github/rulesets/main.json (Settings > Rules) and require the 'quality-gate' check.");
  console.log("       -> until then, `main` is protected by convention only. The CI naming and freshness checks still run.");

  console.log(problems === 0 ? "\ndoctor: no problems found" : `\ndoctor: ${problems} warning(s)`);
}

// --------------------------------------------------------------------------- branch / PR naming

/**
 * The unskippable half of branch discipline: a CI check. Branch protection is a
 * forge setting a template cannot force a fork to enable, so this runs in the
 * pipeline where it cannot be bypassed by a local `--no-verify`.
 */
function cmdCheckBranch(args: Record<string, string>): void {
  const branch = args.branch ?? currentBranch(ROOT);
  const prTitle = args["pr-title"] ?? "";
  const errors: string[] = [];

  if (branch === config.defaultBranch) {
    ok(`on ${config.defaultBranch}, nothing to check`);
    return;
  }
  // A freshly instantiated template has no items, so no branch can be linked to one.
  // The check reports that plainly and passes; it bites from the first item onward.
  const backlog = loadBacklog(ROOT);
  if (backlog.items.length === 0 && backlog.archived.length === 0) {
    ok(`backlog is empty, so branch '${branch}' has nothing to link to yet (this check bites once the first item exists)`);
    return;
  }

  const pattern = branchPattern(config.idPrefix);
  if (!pattern.test(branch)) {
    errors.push(`branch '${branch}' must match ${pattern.source}, e.g. feature/${config.idPrefix}-0007-reject-expired-tokens`);
  }
  const id = new RegExp(`${config.idPrefix}-\\d{4}`).exec(branch)?.[0];
  if (!id) {
    errors.push(`branch '${branch}' does not carry an item id`);
  } else {
    const item = backlog.items.find((i) => i.id === id);
    const archived = backlog.archived.find((i) => i.id === id);
    if (!item && !archived) errors.push(`branch references '${id}', which is not in the backlog`);
    else if (item && item.status !== "in_progress") {
      errors.push(`'${id}' is '${item.status}'; work on a branch requires status 'in_progress' (run \`make start ID=${id}\`)`);
    }
    if (prTitle && !prTitle.includes(id)) errors.push(`PR title must carry '${id}': ${JSON.stringify(prTitle)}`);
  }

  if (errors.length) fail(`branch/PR naming\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  ok(`branch '${branch}' is well formed and linked to a live item`);
}

// --------------------------------------------------------------------------- start

function cmdStart(args: Record<string, string>): void {
  const id = args.id;
  if (!id) fail('ID is required, e.g. `make start ID=ITEM-0007`');
  const backlog = loadBacklog(ROOT);
  const item = backlog.items.find((i) => i.id === id);
  if (!item) fail(`no item '${id}'`);
  if (item.status !== "ready") fail(`'${id}' is '${item.status}'; only a 'ready' item may be started. Interrogate it first (make new-item prints the questions).`);
  const wip = backlog.items.filter((i) => i.status === "in_progress").length;
  if (wip >= config.wipLimit) fail(`WIP is already ${wip}/${config.wipLimit}. Finish or drop something first.`);

  const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 5).join("-");
  const branch = `feature/${id}-${slug}`;
  const owner = args.owner ?? process.env.SDLC_OWNER ?? "unassigned";
  const text = readFileSync(join(ROOT, item.path!), "utf8");
  const updated = text
    .replace(/^status: .*$/m, "status: in_progress")
    .replace(/^owner: .*$\n/m, "")
    .replace(/^branch: .*$\n/m, "")
    .replace(/^(created: .*)$/m, `$1\nowner: ${owner}\nbranch: ${branch}`);
  writeFileSync(join(ROOT, item.path!), updated);
  console.log(`${id} -> in_progress, owner ${owner}, branch ${branch}`);
  console.log("\nNext, in this order:");
  console.log(`  git fetch origin ${config.defaultBranch} && git switch -c ${branch} origin/${config.defaultBranch}`);
  console.log("  make gen && git add -A && git commit   # commit the status change with trailer 'Item: " + id + "'");
  console.log("  write the failing test named by an acceptance criterion, commit it RED, then implement.");
  cmdGen();
}

// --------------------------------------------------------------------------- dispatch

function parseArgs(argv: string[]): { command: string; args: Record<string, string> } {
  const [command = "help", ...rest] = argv;
  const args: Record<string, string> = {};
  for (const token of rest) {
    const m = /^--([a-z-]+)(?:=(.*))?$/.exec(token);
    if (m) args[m[1]!] = m[2] ?? "true";
  }
  for (const key of ["ID", "TYPE", "TITLE", "PARENT", "OWNER", "BRANCH", "PR_TITLE"]) {
    const value = process.env[key];
    if (value) args[key.toLowerCase().replace("_", "-")] = value;
  }
  return { command, args };
}

const COMMANDS: Record<string, (args: Record<string, string>) => void> = {
  status: cmdStatus,
  gen: cmdGen,
  lint: cmdLint,
  "check-fresh": cmdCheckFresh,
  "check-branch": cmdCheckBranch,
  "new-item": cmdNewItem,
  archive: cmdArchive,
  doctor: cmdDoctor,
  start: cmdStart,
  help: () => console.log(`Commands: ${Object.keys(COMMANDS).sort().join(", ")}\nPrefer the Makefile: \`make help\`.`),
};

const { command, args } = parseArgs(process.argv.slice(2));
const handler = COMMANDS[command];
if (!handler) fail(`unknown command '${command}'. Known: ${Object.keys(COMMANDS).sort().join(", ")}`);
handler(args);
