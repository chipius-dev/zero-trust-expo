import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrontMatter, renderFrontMatter } from "../src/frontmatter.ts";

test("parser should return keys and body when front matter is well formed", () => {
  const parsed = parseFrontMatter('---\nid: ITEM-0001\ntitle: "A: colonised title"\nacceptance:\n  - "should reject when empty"\n  - "should accept when valid"\n---\n# Body\ntext');
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.data.id, "ITEM-0001");
  assert.equal(parsed.data.title, "A: colonised title");
  assert.deepEqual(parsed.data.acceptance, ["should reject when empty", "should accept when valid"]);
  assert.equal(parsed.body, "# Body\ntext");
});

test("parser should report an error when the opening fence is missing", () => {
  const parsed = parseFrontMatter("id: ITEM-0001\n");
  assert.match(parsed.errors[0]!, /missing opening/);
});

test("parser should report an error when the closing fence is missing", () => {
  const parsed = parseFrontMatter("---\nid: ITEM-0001\n");
  assert.match(parsed.errors[0]!, /missing closing/);
});

test("parser should reject a duplicate key rather than silently keeping the last one", () => {
  const parsed = parseFrontMatter("---\nid: ITEM-0001\nid: ITEM-0002\n---\n");
  assert.ok(parsed.errors.some((e) => /duplicate key/.test(e)));
  assert.equal(parsed.data.id, "ITEM-0001");
});

test("parser should reject tabs and nested structures outside the allowed grammar", () => {
  assert.ok(parseFrontMatter("---\n\tid: x\n---\n").errors.some((e) => /tabs/.test(e)));
  assert.ok(parseFrontMatter("---\nmeta:\n  nested:\n    deep: 1\n---\n").errors.length > 0);
});

test("parser should reject an unquoted scalar that contains a colon space", () => {
  const parsed = parseFrontMatter("---\ntitle: a: b\n---\n");
  assert.ok(parsed.errors.some((e) => /unsupported scalar/.test(e)));
});

test("render should round trip through the parser without changing values", () => {
  const data = { id: "ITEM-0009", title: "Weird: title | with pipes", acceptance: ["should round trip when rendered"] };
  const text = `${renderFrontMatter(data, ["id", "title", "acceptance"])}\nbody`;
  const parsed = parseFrontMatter(text);
  assert.equal(parsed.errors.length, 0);
  assert.deepEqual(parsed.data, data);
});
