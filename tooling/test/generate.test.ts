import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { makeFixture, writeItem } from "./helpers.ts";

const EPIC = { id: "ITEM-0001", title: "Holding epic", type: "epic", status: "ready", created: "2026-01-01" };

function seed(fx: ReturnType<typeof makeFixture>) {
  writeItem(fx.root, "ITEM-0001", EPIC);
  writeItem(fx.root, "ITEM-0002", {
    id: "ITEM-0002", title: "Reject expired tokens", type: "story", status: "in_progress",
    created: "2026-01-02", parent: "ITEM-0001", owner: "agent-a",
    branch: "feature/ITEM-0002-reject-expired-tokens",
    acceptance: ["should reject the request when the token is expired"],
  });
  writeItem(fx.root, "ITEM-0003", {
    id: "ITEM-0003", title: "Rotate signing keys", type: "story", status: "ready",
    created: "2026-01-03", parent: "ITEM-0001",
    acceptance: ["should rotate the signing key when it reaches its age limit"],
  });
}

test("generate should produce byte identical output when the backlog has not changed", () => {
  const fx = makeFixture();
  seed(fx);
  assert.equal(fx.run(["gen"]).code, 0);
  const first = readFileSync(join(fx.root, "ROADMAP.md"), "utf8");
  const firstIndex = readFileSync(join(fx.root, "backlog", "index.json"), "utf8");
  assert.equal(fx.run(["gen"]).out.trim(), "Already up to date.");
  assert.equal(readFileSync(join(fx.root, "ROADMAP.md"), "utf8"), first);
  assert.equal(readFileSync(join(fx.root, "backlog", "index.json"), "utf8"), firstIndex);
});

test("dashboard should render in flight work and what is next without listing every item", () => {
  const fx = makeFixture();
  seed(fx);
  fx.run(["gen"]);
  const dashboard = readFileSync(join(fx.root, "ROADMAP.md"), "utf8");
  assert.match(dashboard, /GENERATED FILE - DO NOT EDIT/);
  assert.match(dashboard, /\| > \| ITEM-0002 \| story \| Reject expired tokens \| agent-a \|/);
  assert.match(dashboard, /## Next up[\s\S]*ITEM-0003/);
  assert.match(dashboard, /WIP 1\/3/);
});

test("dashboard should contain no ansi escapes, html, or emoji so it renders anywhere", () => {
  const fx = makeFixture();
  seed(fx);
  fx.run(["gen"]);
  const dashboard = readFileSync(join(fx.root, "ROADMAP.md"), "utf8");
  assert.doesNotMatch(dashboard, /\[/, "ansi escape");
  assert.doesNotMatch(dashboard, /<(?!!--)[a-zA-Z/]/, "html tag");
  assert.doesNotMatch(dashboard, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "emoji");
  for (const char of dashboard) assert.ok(char.codePointAt(0)! < 0x2500 || char === "\n", `wide glyph ${JSON.stringify(char)}`);
});

test("dashboard should elide rows beyond the configured ceiling instead of growing forever", () => {
  const fx = makeFixture({ dashboardMaxRows: 2, wipLimit: 99 });
  writeItem(fx.root, "ITEM-0001", EPIC);
  for (let n = 2; n <= 6; n++) {
    const id = `ITEM-000${n}`;
    writeItem(fx.root, id, {
      id, title: `Parallel work ${n}`, type: "story", status: "in_progress",
      created: "2026-01-02", parent: "ITEM-0001", owner: "agent-a",
      branch: `feature/${id}-parallel-work`,
      acceptance: ["should be elided from the dashboard when over the ceiling"],
    });
  }
  fx.run(["gen"]);
  const dashboard = readFileSync(join(fx.root, "ROADMAP.md"), "utf8");
  assert.match(dashboard, /\.\.\.3 more, see `backlog\/index\.json`/);
});

test("index should answer what is next from one small file", () => {
  const fx = makeFixture();
  seed(fx);
  fx.run(["gen"]);
  const index = JSON.parse(readFileSync(join(fx.root, "backlog", "index.json"), "utf8"));
  assert.deepEqual(index.next, ["ITEM-0003"]);
  assert.equal(index.wip.inProgress, 1);
  assert.equal(index.open.length, 3);
  assert.match(index.asOf.backlogDigest, /^[0-9a-f]{10}$/);
});

test("committing the backlog should not make the dashboard stale", () => {
  // The regression that motivated a content digest: with a commit-sha "as of", the
  // dashboard generated alongside an item change went stale the instant it landed,
  // so CI failed on every pull request that touched the backlog.
  const fx = makeFixture();
  seed(fx);
  fx.run(["gen"]);
  assert.equal(fx.run(["check-fresh"]).code, 0);

  const git = (args: string[]) => execFileSync("git", args, { cwd: fx.root, stdio: "ignore" });
  git(["add", "-A"]);
  git(["commit", "-qm", "add backlog and regenerated dashboard"]);

  const after = fx.run(["check-fresh"]);
  assert.equal(after.code, 0, `dashboard went stale merely by being committed:\n${after.out}`);
});

test("check-fresh should fail when a generated file is edited by hand", () => {
  const fx = makeFixture();
  seed(fx);
  fx.run(["gen"]);
  assert.equal(fx.run(["check-fresh"]).code, 0);

  const path = join(fx.root, "ROADMAP.md");
  writeFileSync(path, `${readFileSync(path, "utf8")}\n<!-- a human edited this -->\n`);
  const result = fx.run(["check-fresh"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /stale or hand-edited: ROADMAP\.md/);

  fx.run(["gen"]);
  assert.equal(fx.run(["check-fresh"]).code, 0);
});

test("dashboard should report an item whose status contradicts git", () => {
  const fx = makeFixture();
  seed(fx);
  fx.run(["gen"]);
  const dashboard = readFileSync(join(fx.root, "ROADMAP.md"), "utf8");
  assert.match(dashboard, /## Status contradicting git[\s\S]*G001[\s\S]*ITEM-0002/);
});

test("awaiting review should be derived from git rather than stored on the item", () => {
  const fx = makeFixture();
  seed(fx);
  const g = (args: string[]) => execFileSync("git", args, { cwd: fx.root, stdio: "ignore" });
  g(["add", "-A"]);
  g(["commit", "-qm", "seed backlog"]);
  g(["switch", "-qc", "feature/ITEM-0002-reject-expired-tokens"]);
  writeFileSync(join(fx.root, "work.txt"), "work\n");
  g(["add", "-A"]);
  g(["commit", "-qm", "work\n\nItem: ITEM-0002"]);

  fx.run(["gen"]);
  const index = JSON.parse(readFileSync(join(fx.root, "backlog", "index.json"), "utf8"));
  assert.deepEqual(index.awaitingReview, ["ITEM-0002"]);
  assert.match(readFileSync(join(fx.root, "ROADMAP.md"), "utf8"), /ITEM-0002.*\| yes \|/);
  // and it is nowhere in the stored item
  assert.doesNotMatch(readFileSync(join(fx.root, "backlog", "items", "ITEM-0002.md"), "utf8"), /awaiting/i);
});

test("claude pointer should be generated from agents md so the two cannot drift", () => {
  const fx = makeFixture();
  seed(fx);
  writeFileSync(join(fx.root, "AGENTS.md"), "# House rules\n\nbody\n");
  fx.run(["gen"]);
  const pointer = readFileSync(join(fx.root, "CLAUDE.md"), "utf8");
  assert.match(pointer, /GENERATED FILE - DO NOT EDIT/);
  assert.match(pointer, /# House rules/);

  writeFileSync(join(fx.root, "CLAUDE.md"), "# I have drifted\n");
  assert.equal(fx.run(["check-fresh"]).code, 1);
});
