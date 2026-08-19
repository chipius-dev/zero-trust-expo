# Cursor IDE Adapter

This adapter configures the **Cursor** AI editor (`.cursorrules` or `.cursor/rules/`) for this repository.

---

## Usage

You can link `.cursorrules` at the root of the repository to point to this adapter:
```bash
ln -sf .agents/cursor/.cursorrules .cursorrules
```
Or run `bash .agents/sync-adapters.sh` to configure it automatically.

---

## Contents of `.cursorrules`

The rules file instructs Cursor to use [`AGENTS.md`](file:///AGENTS.md) and [`docs/`](file:///docs) as its source of truth.
