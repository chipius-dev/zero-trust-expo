# Google Antigravity & Gemini Adapter

This adapter configures **Google Antigravity** and Gemini agent sessions to adhere to this repository's Agentic SDLC standards.

---

## Configuration

When using Antigravity in this repository:
- The agent automatically reads the root [`AGENTS.md`](file:///AGENTS.md).
- Follow all workflows specified in [`docs/workflows/`](file:///docs/workflows).
- Ensure all quality checks pass via `make check` or `bash tooling/scripts/check-quality.sh`.

## Antigravity Rules / Skills Integration
If configuring custom skills or rules in `.gemini/` or Antigravity settings:
1. Reference [`AGENTS.md`](file:///AGENTS.md) as the primary instruction entry point.
2. Link to [`docs/standards/`](file:///docs/standards) for coding and security standards.
