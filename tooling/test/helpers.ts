import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const TOOLING_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
export const CLI = join(TOOLING_DIR, "src", "cli.ts");

export interface Fixture { root: string; run: (args: string[], env?: Record<string, string>) => { code: number; out: string }; }

/** A throwaway git repo with the tooling copied in: the same code CI runs, in isolation. */
export function makeFixture(config: Record<string, unknown> = {}): Fixture {
  const root = mkdtempSync(join(tmpdir(), "sdlc-"));
  mkdirSync(join(root, "backlog", "items"), { recursive: true });
  mkdirSync(join(root, "backlog", "archive"), { recursive: true });
  cpSync(TOOLING_DIR, join(root, "tooling"), { recursive: true });
  writeFileSync(join(root, "sdlc.config.json"), JSON.stringify({
    idPrefix: "ITEM", defaultBranch: "main", wipLimit: 3,
    dashboardMaxRows: 25, maxContextLines: 120, testGlobs: ["tests/**/*"],
    ...config,
  }, null, 2));

  const g = (args: string[]) => execFileSync("git", args, { cwd: root, stdio: "ignore" });
  g(["init", "-q", "-b", "main"]);
  g(["config", "user.email", "fixture@example.invalid"]);
  g(["config", "user.name", "Fixture"]);
  writeFileSync(join(root, "README.md"), "# fixture\n");
  g(["add", "-A"]);
  g(["commit", "-qm", "seed"]);

  const run = (args: string[], env: Record<string, string> = {}) => {
    try {
      const out = execFileSync(process.execPath, [join(root, "tooling", "src", "cli.ts"), ...args], {
        cwd: root, encoding: "utf8", env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"],
      });
      return { code: 0, out };
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  };
  return { root, run };
}

export function writeItem(root: string, id: string, front: Record<string, string | string[]>, body = FULL_BODY): void {
  const lines = ["---"];
  for (const [key, value] of Object.entries(front)) {
    if (Array.isArray(value)) { lines.push(`${key}:`); for (const v of value) lines.push(`  - ${JSON.stringify(v)}`); }
    else lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---");
  writeFileSync(join(root, "backlog", "items", `${id}.md`), `${lines.join("\n")}\n${body}`);
}

export const FULL_BODY = [
  "",
  "## Why",
  "Concrete pain, stated once.",
  "",
  "## Scope",
  "- The one behaviour this item adds.",
  "",
  "## Out of scope",
  "- Anything touching billing.",
  "",
  "## Constraints",
  "- Must stay offline.",
  "",
  "## Decisions and rejected alternatives",
  "- Chose a flat file over a database because the backlog must be diffable.",
  "",
  "## Links",
  "- docs/lifecycle.md",
  "",
].join("\n");

export const MINIMAL_FRONT = {
  id: "ITEM-0001", title: "An epic that holds stories", type: "epic", status: "draft", created: "2026-01-01",
};
