# Contributing to Agentic SDLC Template

We welcome contributions from both **human engineers** and **AI agents**! To maintain high code quality and consistency, please follow the guidelines outlined below.

---

## 🛠️ Contribution Principles

1. **Platform Agnosticism**:
   - Never introduce proprietary AI assistant markers or instructions directly into core `docs/`, `templates/`, or source directories.
   - Any platform-specific integration MUST go into [`.agents/`](file:///.agents).

2. **Mandatory In-Repo Roadmap & Decision Tracking**:
   - All tasks and features MUST be tracked in [`ROADMAP.md`](file:///ROADMAP.md).
   - Any approved technical or scope decisions MUST be documented in the Decision Log with all context needed to reproduce the outcome.

3. **Matt Pocock's 7 Phases of AI-Driven Development**:
   - Follow the 7-phase methodology detailed in [`docs/workflows/`](file:///docs/workflows).
   - Keep tasks sized into small vertical slices within the ~100k token "Smart Zone".
   - Practice Test-Driven Development (Red -> Green -> Refactor).

4. **Quality Gate Compliance**:
   - All contributions must pass the verification suite:
     ```bash
     make check
     ```
   - No broken links, unformatted code, or failing test suites.

---

## 🔄 Pull Request Workflow

1. **Pick or Define Task in Roadmap**:
   - Check [`ROADMAP.md`](file:///ROADMAP.md) and assign the vertical slice.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Follow the SDLC Phases & TDD**:
   - Write failing tests first, implement minimal code, and refactor.
4. **Run Local Quality Checks**:
   ```bash
   make check
   ```
5. **Submit Pull Request**:
   - Complete the checklist in [`templates/review-checklist.md`](file:///templates/review-checklist.md).
   - Confirm CI workflows pass cleanly.
