/** Reads the backlog off disk. The only reader; nothing else globs the tree. */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseFrontMatter } from "./frontmatter.ts";
import type { Item, ItemType, Status } from "./model.ts";

export interface LoadIssue { file: string; message: string; }
export interface Backlog {
  items: Item[];        // live item files, sorted by id
  archived: Item[];     // rollup rows, sorted by id
  issues: LoadIssue[];  // parse-level failures (never silently ignored)
}

export const ITEMS_DIR = join("backlog", "items");
export const ARCHIVE_DIR = join("backlog", "archive");

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function asScalar(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value.join(" ") : value;
}

export function loadBacklog(root: string): Backlog {
  const issues: LoadIssue[] = [];
  const items: Item[] = [];

  const itemsPath = join(root, ITEMS_DIR);
  if (existsSync(itemsPath)) {
    for (const name of readdirSync(itemsPath).filter((f) => f.endsWith(".md")).sort()) {
      const rel = join(ITEMS_DIR, name);
      const parsed = parseFrontMatter(readFileSync(join(itemsPath, name), "utf8"));
      for (const error of parsed.errors) issues.push({ file: rel, message: error });
      const d = parsed.data;
      items.push({
        id: asScalar(d.id) ?? "",
        title: asScalar(d.title) ?? "",
        type: (asScalar(d.type) ?? "") as ItemType,
        status: (asScalar(d.status) ?? "") as Status,
        created: asScalar(d.created) ?? "",
        parent: asScalar(d.parent) || undefined,
        owner: asScalar(d.owner) || undefined,
        branch: asScalar(d.branch) || undefined,
        acceptance: asList(d.acceptance),
        blockedBy: asList(d.blocked_by),
        droppedReason: asScalar(d.dropped_reason) || undefined,
        labels: asList(d.labels),
        body: parsed.body,
        path: rel,
        archived: false,
      });
    }
  }

  return { items: items.sort(byId), archived: loadArchive(root, issues).sort(byId), issues };
}

const byId = (a: Item, b: Item) => a.id.localeCompare(b.id);

/**
 * Archive files are rollups, not full items: one markdown table per year. Full
 * context for a closed item stays recoverable from git history; the row exists so
 * IDs are never reused and closed work stays countable without loading the world.
 *
 * Row shape: | ID | type | title | final status | closed (ISO date) | note |
 */
export function loadArchive(root: string, issues: LoadIssue[]): Item[] {
  const out: Item[] = [];
  const dir = join(root, ARCHIVE_DIR);
  if (!existsSync(dir)) return out;

  for (const name of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
    const rel = join(ARCHIVE_DIR, name);
    const text = readFileSync(join(dir, name), "utf8");
    for (const line of text.split("\n")) {
      if (!/^\|\s*[A-Z]+-\d{4}\s*\|/.test(line)) continue;
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 6) { issues.push({ file: rel, message: `archive row needs 6 cells, found ${cells.length}: ${line}` }); continue; }
      const [id, type, title, status, created, note] = cells as [string, string, string, string, string, string];
      out.push({
        id, title, type: type as ItemType, status: status as Status, created,
        acceptance: [], blockedBy: [], labels: [], droppedReason: note || undefined,
        body: "", path: rel, archived: true,
      });
    }
  }
  return out;
}

/** Highest ID ever allocated, across live and archived items. Never reuses a freed ID. */
export function highWaterMark(backlog: Backlog, prefix: string): number {
  let max = 0;
  for (const item of [...backlog.items, ...backlog.archived]) {
    const m = new RegExp(`^${prefix}-(\\d{4})$`).exec(item.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

export function formatId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}
