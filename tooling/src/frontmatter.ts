/**
 * Strict, dependency-free parser for the front-matter subset this repo allows.
 *
 * Deliberately NOT a YAML parser. The accepted grammar is:
 *
 *   ---
 *   key: scalar
 *   key:
 *     - scalar
 *     - scalar
 *   ---
 *
 * Anything else (nesting, anchors, block scalars, inline flow collections, tabs)
 * is a parse error rather than a silent reinterpretation. A closed grammar is
 * what makes two different agents produce the same reading of the same file.
 */

export type FrontMatterValue = string | string[];
export interface ParsedFile {
  data: Record<string, FrontMatterValue>;
  body: string;
  errors: string[];
}

function unquote(raw: string): { value: string; error?: string } {
  const s = raw.trim();
  if (s.length >= 2 && ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'"))) {
    const inner = s.slice(1, -1);
    if (inner.includes(s[0]!)) return { value: inner, error: "nested quote of the same kind" };
    return { value: inner };
  }
  if (s.includes(": ") || s.startsWith("&") || s.startsWith("*") || s.startsWith("|") || s.startsWith(">")) {
    return { value: s, error: `unsupported scalar '${s}' (quote it, or simplify)` };
  }
  return { value: s };
}

export function parseFrontMatter(text: string): ParsedFile {
  const errors: string[] = [];
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0] !== "---") {
    return { data: {}, body: normalized, errors: ["missing opening '---' front-matter fence on line 1"] };
  }
  const closeIdx = lines.indexOf("---", 1);
  if (closeIdx === -1) {
    return { data: {}, body: "", errors: ["missing closing '---' front-matter fence"] };
  }

  const data: Record<string, FrontMatterValue> = {};
  let currentListKey: string | null = null;

  for (let i = 1; i < closeIdx; i++) {
    const line = lines[i]!;
    const lineNo = i + 1;
    if (line.trim() === "") { currentListKey = null; continue; }
    if (line.includes("\t")) { errors.push(`line ${lineNo}: tabs are not allowed in front matter`); continue; }
    if (line.trimStart().startsWith("#")) continue;

    const listMatch = /^ {2}- (.*)$/.exec(line);
    if (listMatch) {
      if (currentListKey === null) { errors.push(`line ${lineNo}: list item with no preceding key`); continue; }
      const { value, error } = unquote(listMatch[1]!);
      if (error) errors.push(`line ${lineNo}: ${error}`);
      (data[currentListKey] as string[]).push(value);
      continue;
    }

    const kvMatch = /^([a-z][a-z0-9_]*):(.*)$/.exec(line);
    if (!kvMatch) { errors.push(`line ${lineNo}: not a 'key: value' or '  - item' line: ${JSON.stringify(line)}`); continue; }

    const key = kvMatch[1]!;
    const rest = kvMatch[2]!;
    if (key in data) { errors.push(`line ${lineNo}: duplicate key '${key}'`); continue; }

    if (rest.trim() === "") { data[key] = []; currentListKey = key; continue; }
    if (!rest.startsWith(" ")) { errors.push(`line ${lineNo}: expected a space after '${key}:'`); continue; }
    const { value, error } = unquote(rest);
    if (error) errors.push(`line ${lineNo}: ${error}`);
    data[key] = value;
    currentListKey = null;
  }

  return { data, body: lines.slice(closeIdx + 1).join("\n"), errors };
}

/** Render front matter back out in canonical form. Round-trips with parseFrontMatter. */
export function renderFrontMatter(data: Record<string, FrontMatterValue>, order: readonly string[]): string {
  const keys = [...order.filter((k) => k in data), ...Object.keys(data).filter((k) => !order.includes(k)).sort()];
  const out: string[] = ["---"];
  for (const key of keys) {
    const value = data[key]!;
    if (Array.isArray(value)) {
      out.push(`${key}:`);
      for (const entry of value) out.push(`  - ${quoteIfNeeded(entry)}`);
    } else {
      out.push(`${key}: ${quoteIfNeeded(value)}`);
    }
  }
  out.push("---");
  return out.join("\n");
}

function quoteIfNeeded(value: string): string {
  return /^[A-Za-z0-9][A-Za-z0-9 _.\-\/]*$/.test(value) && !value.includes(": ") ? value : JSON.stringify(value);
}
