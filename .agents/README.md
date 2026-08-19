# AI Platform Adapters Directory

This directory contains **platform-specific and tool-specific configurations** for various AI coding assistants (such as Google Antigravity, Cursor, Claude Code, GitHub Copilot, Windsurf, Roo/Cline, etc.).

---

## 🎯 Architecture & Adapter Principles

1. **Single Source of Truth**:
   - The universal source of truth for all coding standards, SDLC workflows, and architecture records is [`AGENTS.md`](file:///AGENTS.md) and [`docs/`](file:///docs).
   - Platform adapter files must **NEVER** duplicate core documentation or invent divergent project rules.
   - Adapters simply instruct each AI tool where to find the source of truth and how to adhere to the project's SDLC workflows.

2. **Strict Isolation**:
   - Keep all vendor-specific artifacts within `.agents/<platform>/` or as documented links/symlinks.
   - Core repository docs in `docs/` must remain completely platform-agnostic.

---

## 📁 Supported Platform Adapters

| Platform | Adapter Directory | Native Config File(s) | Description |
| :--- | :--- | :--- | :--- |
| **Google Antigravity** | [`.agents/antigravity/`](file:///.agents/antigravity) | `.gemini/` / Antigravity rules & skills | Configuration for Google Antigravity agentic pair programming |
| **Cursor** | [`.agents/cursor/`](file:///.agents/cursor) | `.cursorrules`, `.cursor/rules/` | Cursor editor system prompt and rule definitions |
| **Claude Code & Projects** | [`.agents/claude/`](file:///.agents/claude) | `CLAUDE.md` / Claude Project Knowledge | Claude Code CLI & web project instructions |
| **GitHub Copilot** | [`.agents/copilot/`](file:///.agents/copilot) | `.github/copilot-instructions.md` | Workspace instructions for GitHub Copilot Chat & Agent mode |
| **Windsurf** | [`.agents/windsurf/`](file:///.agents/windsurf) | `.windsurfrules` | Cascade and rule settings for Codeium Windsurf |

---

## 🔄 Synchronizing Adapters

To verify adapter consistency or generate standard symlinks/files into the repository root:
```bash
bash .agents/sync-adapters.sh
```
