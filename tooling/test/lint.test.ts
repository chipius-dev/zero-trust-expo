import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { makeFixture, writeItem, FULL_BODY } from "./helpers.ts";

const EPIC = { id: "ITEM-0001", title: "Holding epic", type: "epic", status: "ready", created: "2026-01-01" };

test("lint should pass when a ready story satisfies the whole authoring checklist", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", EPIC);
  writeItem(fx.root, "ITEM-0002", {
    id: "ITEM-0002", title: "Reject expired tokens", type: "story", status: "ready",
    created: "2026-01-02", parent: "ITEM-0001", acceptance: ["should reject the request when the token is expired"],
  });
  const result = fx.run(["lint"]);
  assert.equal(result.code, 0, result.out);
});

test("lint should reject an acceptance criterion that cannot fail", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", EPIC);
  writeItem(fx.root, "ITEM-0002", {
    id: "ITEM-0002", title: "Token check", type: "story", status: "ready",
    created: "2026-01-02", parent: "ITEM-0001", acceptance: ["should verify the token works correctly"],
  });
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L010.*unfalsifiable term 'works correctly'/s);
});

test("lint should reject a ready item that never named anything out of scope", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", EPIC, FULL_BODY.replace("- Anything touching billing.", "- "));
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L009.*Out of scope/s);
});

test("lint should allow a draft item to be incomplete but block it at ready", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", { ...EPIC, status: "draft" }, "\nnothing here yet\n");
  assert.equal(fx.run(["lint"]).code, 0);

  writeItem(fx.root, "ITEM-0001", { ...EPIC, status: "ready" }, "\nnothing here yet\n");
  const blocked = fx.run(["lint"]);
  assert.equal(blocked.code, 1);
  assert.match(blocked.out, /L009/);
});

test("lint should reject an unknown front matter key so the schema stays closed", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", { ...EPIC, priority: "P0" } as Record<string, string>);
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L017.*unknown front-matter key 'priority'/s);
});

test("lint should reject a story whose parent is not an epic", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", { ...EPIC, type: "initiative" });
  writeItem(fx.root, "ITEM-0002", {
    id: "ITEM-0002", title: "Orphan story", type: "story", status: "ready",
    created: "2026-01-02", parent: "ITEM-0001", acceptance: ["should belong to an epic when created"],
  });
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L006.*must have a epic parent/s);
});

test("lint should reject a dropped item that gives no reason", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", { ...EPIC, status: "dropped" });
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L012/);
});

test("lint should require a blocked item to name its blocker", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", { ...EPIC, status: "blocked" });
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L011/);
});

test("lint should force a done item into the archive instead of leaving it live", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", { ...EPIC, status: "done" });
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L015.*make archive ID=ITEM-0001/s);
});

test("lint should refuse to call an item done when its acceptance test does not exist", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", EPIC);
  writeItem(fx.root, "ITEM-0002", {
    id: "ITEM-0002", title: "Untested claim", type: "story", status: "done",
    created: "2026-01-02", parent: "ITEM-0001", acceptance: ["should emit an audit record when a token is refused"],
  });
  const missing = fx.run(["lint"]);
  assert.equal(missing.code, 1);
  assert.match(missing.out, /L014.*no matching test/s);

  // Writing the named test is what makes the claim true; nothing else changes.
  mkdirSync(join(fx.root, "tests"), { recursive: true });
  writeFileSync(join(fx.root, "tests", "audit.test.ts"),
    'test("should emit an audit record when a token is refused", () => {});\n');
  assert.doesNotMatch(fx.run(["lint"]).out, /L014/);
});

test("lint should reject an id that is already archived so ids are never reused", () => {
  const fx = makeFixture();
  writeFileSync(join(fx.root, "backlog", "archive", "2026.md"), [
    "# Archive 2026", "",
    "| ID | Type | Title | Final status | Closed | Note |",
    "| :--- | :--- | :--- | :--- | :--- | :--- |",
    "| ITEM-0001 | story | Previously closed | done | 2026-01-05 | feature/ITEM-0001-x |",
    "",
  ].join("\n"));
  writeItem(fx.root, "ITEM-0001", EPIC);
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L003.*already archived/s);
});

test("lint should fail when more items are in progress than the wip limit allows", () => {
  const fx = makeFixture({ wipLimit: 1 });
  writeItem(fx.root, "ITEM-0001", EPIC);
  for (const n of ["0002", "0003"]) {
    writeItem(fx.root, `ITEM-${n}`, {
      id: `ITEM-${n}`, title: `Concurrent work ${n}`, type: "story", status: "in_progress",
      created: "2026-01-02", parent: "ITEM-0001", owner: "agent-a",
      branch: `feature/ITEM-${n}-concurrent-work`,
      acceptance: ["should count against the wip limit when in progress"],
    });
  }
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L018.*over the WIP limit of 1/s);
});

test("lint should reject a branch name that does not carry the item id", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", EPIC);
  writeItem(fx.root, "ITEM-0002", {
    id: "ITEM-0002", title: "Mislabelled branch", type: "story", status: "in_progress",
    created: "2026-01-02", parent: "ITEM-0001", owner: "agent-a", branch: "feature/some-random-name",
    acceptance: ["should link the branch to the item when work starts"],
  });
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L020/);
});

test("lint should warn when an in progress item has no branch or commit in git", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", EPIC);
  writeItem(fx.root, "ITEM-0002", {
    id: "ITEM-0002", title: "Claimed but absent", type: "story", status: "in_progress",
    created: "2026-01-02", parent: "ITEM-0001", owner: "agent-a",
    acceptance: ["should show as drift when git disagrees with status"],
  });
  const result = fx.run(["lint"]);
  assert.equal(result.code, 0, "git drift is a warning, not an error");
  assert.match(result.out, /G001/);
  assert.match(result.out, /G002/);
});

test("lint should cap the context record so items stay briefings not transcripts", () => {
  const fx = makeFixture({ maxContextLines: 20 });
  writeItem(fx.root, "ITEM-0001", EPIC, `${FULL_BODY}\n${"filler\n".repeat(40)}`);
  const result = fx.run(["lint"]);
  assert.equal(result.code, 1);
  assert.match(result.out, /L013.*over the 20-line cap/s);
});

test("archive should move a done item into the year rollup and free the items directory", () => {
  const fx = makeFixture();
  writeItem(fx.root, "ITEM-0001", { ...EPIC, status: "done" });
  const result = fx.run(["archive"], { ID: "ITEM-0001" });
  assert.equal(result.code, 0, result.out);
  const year = new Date().toISOString().slice(0, 4);
  const archive = readFileSync(join(fx.root, "backlog", "archive", `${year}.md`), "utf8");
  assert.match(archive, /\| ITEM-0001 \| epic \| Holding epic \| done \|/);
  assert.equal(fx.run(["lint"]).code, 0);
});
