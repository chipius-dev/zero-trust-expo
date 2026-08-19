/**
 * Template self-test: instantiate a fresh repo and drive the whole loop through the
 * real CLI - author an item, get refused for being vague, pass the gate, start work,
 * write the named test, close it, archive it. A template that cannot prove its own
 * loop still works will not work.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { makeFixture, FULL_BODY } from "./helpers.ts";

test("the full loop should run end to end on a freshly instantiated repo", () => {
  const fx = makeFixture();
  const git = (args: string[]) => execFileSync("git", args, { cwd: fx.root, stdio: "ignore" });
  const itemPath = (id: string) => join(fx.root, "backlog", "items", `${id}.md`);

  // 1. Author an epic, then a story under it. IDs are allocated, never chosen.
  const epic = fx.run(["new-item"], { TYPE: "epic", TITLE: "Token lifecycle" });
  assert.equal(epic.code, 0, epic.out);
  assert.match(epic.out, /Created backlog\/items\/ITEM-0001\.md at status 'draft'/);
  assert.match(epic.out, /interrogate the requester/, "new-item must print the grill questions");

  const story = fx.run(["new-item"], { TYPE: "story", TITLE: "Reject expired tokens", PARENT: "ITEM-0001" });
  assert.equal(story.code, 0, story.out);
  assert.match(story.out, /ITEM-0002/);

  // 2. A story cannot skip the interview: promoting it while vague is refused.
  for (const id of ["ITEM-0001", "ITEM-0002"]) {
    writeFileSync(itemPath(id), readFileSync(itemPath(id), "utf8").replace("status: draft", "status: ready"));
  }
  const vague = fx.run(["lint"]);
  assert.equal(vague.code, 1, "a scaffolded item must not pass as ready");
  assert.match(vague.out, /L009|L010/);

  // 3. Answer the interview. Now it passes.
  for (const id of ["ITEM-0001", "ITEM-0002"]) {
    const front = readFileSync(itemPath(id), "utf8").split("---")[1]!;
    writeFileSync(itemPath(id), `---${front.replace('"should ... when ..."', '"should reject the request when the token is expired"')}---\n${FULL_BODY}`);
  }
  assert.equal(fx.run(["lint"]).code, 0, fx.run(["lint"]).out);

  // 4. Starting work is a command, not a convention: it sets status, owner and branch.
  const started = fx.run(["start"], { ID: "ITEM-0002", OWNER: "agent-a" });
  assert.equal(started.code, 0, started.out);
  const storyText = readFileSync(itemPath("ITEM-0002"), "utf8");
  assert.match(storyText, /status: in_progress/);
  assert.match(storyText, /branch: feature\/ITEM-0002-reject-expired-tokens/);

  git(["add", "-A"]);
  git(["commit", "-qm", "start ITEM-0002\n\nItem: ITEM-0002"]);
  git(["switch", "-qc", "feature/ITEM-0002-reject-expired-tokens"]);

  // 5. Branch and PR naming are checkable without a forge.
  assert.equal(fx.run(["check-branch"]).code, 0);
  const badTitle = fx.run(["check-branch", "--pr-title=fix the thing"]);
  assert.equal(badTitle.code, 1);
  assert.match(badTitle.out, /PR title must carry 'ITEM-0002'/);

  // 6. Red first: the test named by the acceptance criterion has to exist.
  const done = readFileSync(itemPath("ITEM-0002"), "utf8").replace("status: in_progress", "status: done");
  writeFileSync(itemPath("ITEM-0002"), done);
  const undone = fx.run(["lint"]);
  assert.equal(undone.code, 1);
  assert.match(undone.out, /L014.*no matching test/s, "done without the named test must fail");

  mkdirSync(join(fx.root, "tests"), { recursive: true });
  writeFileSync(join(fx.root, "tests", "token.test.ts"),
    'test("should reject the request when the token is expired", () => {});\n');
  git(["add", "-A"]);
  git(["commit", "-qm", "red then green for ITEM-0002\n\nItem: ITEM-0002"]);

  // 7. Closing an item means archiving it, so the ID is never reused.
  const archived = fx.run(["archive"], { ID: "ITEM-0002" });
  assert.equal(archived.code, 0, archived.out);
  const year = new Date().toISOString().slice(0, 4);
  assert.match(readFileSync(join(fx.root, "backlog", "archive", `${year}.md`), "utf8"), /\| ITEM-0002 \|.*\| done \|/);

  // 8. A new item after archiving must not reuse the freed ID.
  const next = fx.run(["new-item"], { TYPE: "story", TITLE: "Rotate signing keys", PARENT: "ITEM-0001" });
  assert.match(next.out, /ITEM-0003/, "ids are never reused after an item is closed");

  // 9. Everything derived is current, and the dashboard tells the truth.
  fx.run(["gen"]);
  assert.equal(fx.run(["check-fresh"]).code, 0);
  const dashboard = readFileSync(join(fx.root, "ROADMAP.md"), "utf8");
  assert.match(dashboard, /Done \| 1 \|/);
  assert.match(dashboard, /Nothing in progress\./);
  assert.equal(fx.run(["lint"]).code, 0);
});

test("start should refuse an item that has not passed the interview", () => {
  const fx = makeFixture();
  fx.run(["new-item"], { TYPE: "epic", TITLE: "Unreviewed epic" });
  const result = fx.run(["start"], { ID: "ITEM-0001" });
  assert.equal(result.code, 1);
  assert.match(result.out, /only a 'ready' item may be started/);
});

test("check-branch should reject a branch that references an item nobody started", () => {
  const fx = makeFixture();
  fx.run(["new-item"], { TYPE: "epic", TITLE: "Something real exists" });
  const result = fx.run(["check-branch", "--branch=feature/ITEM-0404-ghost-work"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /not in the backlog/);
});

test("check-branch should reject a branch name that ignores the convention", () => {
  const fx = makeFixture();
  fx.run(["new-item"], { TYPE: "epic", TITLE: "Something real exists" });
  const result = fx.run(["check-branch", "--branch=my-cool-refactor"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /must match/);
});

test("doctor should report how far behind the default branch the session is", () => {
  const fx = makeFixture();
  const result = fx.run(["doctor"]);
  assert.equal(result.code, 0, result.out);
  assert.match(result.out, /branch protection/);
  assert.match(result.out, /WIP 0\/3/);
});

test("check-branch should pass on an empty backlog and bite once an item exists", () => {
  const fx = makeFixture();
  const empty = fx.run(["check-branch", "--branch=some/bootstrap-branch"]);
  assert.equal(empty.code, 0, empty.out);
  assert.match(empty.out, /backlog is empty/);

  fx.run(["new-item"], { TYPE: "epic", TITLE: "First real item" });
  const now = fx.run(["check-branch", "--branch=some/bootstrap-branch"]);
  assert.equal(now.code, 1);
  assert.match(now.out, /must match/);
});
