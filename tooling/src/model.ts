/** Shared vocabulary. Every closed enum in the process lives here and nowhere else. */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Stored status. Exactly one place holds status truth: the `status:` field of a
 * backlog item file. Everything else in the repo derives from it.
 *
 * `awaiting_review` is deliberately NOT stored. It is derivable from git (an
 * in-progress item whose branch carries commits that are not on the default
 * branch). Storing it would create the second source of truth this process exists
 * to prevent. See docs/lifecycle.md.
 */
export const STATUSES = ["draft", "ready", "in_progress", "blocked", "done", "dropped"] as const;
export type Status = (typeof STATUSES)[number];

export const OPEN_STATUSES: readonly Status[] = ["draft", "ready", "in_progress", "blocked"];
export const CLOSED_STATUSES: readonly Status[] = ["done", "dropped"];

export const TYPES = ["initiative", "epic", "story"] as const;
export type ItemType = (typeof TYPES)[number];

/** Legal parent type for each item type. `null` means "must have no parent". */
export const PARENT_OF: Record<ItemType, ItemType | null> = {
  initiative: null,
  epic: "initiative",
  story: "epic",
};

/**
 * Narrow, single-width glyphs only. No emoji, no ANSI, no box drawing: the
 * dashboard has to survive being pasted into a chat window and read on a phone.
 */
export const GLYPH: Record<Status, string> = {
  draft: "o",
  ready: "*",
  in_progress: ">",
  blocked: "!",
  done: "x",
  dropped: "-",
};

export const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft (not yet interrogated)",
  ready: "Ready (interrogated, may be started)",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  dropped: "Dropped",
};

/** Front-matter keys. The schema is closed: an unknown key is a lint error. */
export const REQUIRED_KEYS = ["id", "title", "type", "status", "created"] as const;
export const OPTIONAL_KEYS = ["parent", "owner", "branch", "acceptance", "blocked_by", "dropped_reason", "labels"] as const;
export const KEY_ORDER = [...REQUIRED_KEYS, ...OPTIONAL_KEYS] as const;

/** Body headings required before an item may leave `draft`. This is the grill-me gate. */
export const REQUIRED_SECTIONS = ["## Why", "## Scope", "## Out of scope", "## Constraints", "## Decisions and rejected alternatives", "## Links"] as const;

/**
 * Words that make an acceptance criterion unfalsifiable. A criterion containing
 * one of these cannot fail, so it is not a criterion.
 */
export const VAGUE_TERMS = [
  "works correctly", "works properly", "works as expected", "works well", "works fine",
  "correctly", "properly", "as expected", "user-friendly", "user friendly", "intuitive",
  "robust", "seamless", "performant", "fast enough", "good enough", "makes sense",
  "no bugs", "high quality", "etc",
] as const;

export interface Config {
  idPrefix: string;
  defaultBranch: string;
  wipLimit: number;
  dashboardMaxRows: number;
  maxContextLines: number;
  testGlobs: string[];
}

export const DEFAULT_CONFIG: Config = {
  idPrefix: "ITEM",
  defaultBranch: "main",
  wipLimit: 3,
  dashboardMaxRows: 25,
  maxContextLines: 120,
  testGlobs: [],
};

export function loadConfig(root: string): Config {
  try {
    const raw = JSON.parse(readFileSync(join(root, "sdlc.config.json"), "utf8")) as Partial<Config>;
    return { ...DEFAULT_CONFIG, ...raw };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function idPattern(prefix: string): RegExp {
  return new RegExp(`^${prefix}-\\d{4}$`);
}

/** feature/ITEM-0001-short-slug | bug/ITEM-0002-short-slug */
export function branchPattern(prefix: string): RegExp {
  return new RegExp(`^(feature|bug)/${prefix}-\\d{4}-[a-z0-9]+(-[a-z0-9]+)*$`);
}

export interface Item {
  id: string;
  title: string;
  type: ItemType;
  status: Status;
  created: string;
  parent?: string;
  owner?: string;
  branch?: string;
  acceptance: string[];
  blockedBy: string[];
  droppedReason?: string;
  labels: string[];
  body: string;
  /** Repo-relative path, or null for items that live only as an archive row. */
  path: string | null;
  archived: boolean;
}
