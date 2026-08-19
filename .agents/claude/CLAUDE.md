# Claude Code Instructions for Agentic SDLC Template
# Source of truth: AGENTS.md, ROADMAP.md, and docs/

Welcome to this repository. All primary behavioral guidelines and context are defined in:
- Universal Guidelines: AGENTS.md
- In-Repo Roadmap & Decision Log: ROADMAP.md
- Workflows (Matt Pocock's 7 Phases): docs/workflows/
- Coding Standards: docs/standards/
- Architecture: docs/architecture/

## Common Commands
- Run quality checks: `make check` or `bash tooling/scripts/check-quality.sh`
- Run validation suite: `python3 tooling/scripts/validate-docs.py`

## Rules
- ALWAYS check and update ROADMAP.md when selecting, progressing, or finishing tasks.
- Document approved technical decisions with reproducibility context in ROADMAP.md.
- Follow the 7-phase lifecycle (Idea -> Research -> Prototype -> PRD & Alignment -> Planning -> Execution -> QA & Loopback).
- Keep sessions in the ~100k token "Smart Zone" using vertical slices and TDD.
- Ensure all quality checks and linters pass before completing tasks.
- Keep all documentation and context AI platform agnostic.
