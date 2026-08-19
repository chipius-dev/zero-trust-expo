# Project Roadmap & Decision Log

> **MANDATORY FOR ALL AI AGENTS & DEVELOPERS**:
> This in-repo roadmap is the **single source of truth** for defining work, selecting tasks, tracking progress, and recording approved technical decisions in this repository.
> 
> **Operational Rule**: Any AI agent operating in this repository MUST:
> 1. Consult this roadmap before starting any task to verify priority, status, and constraints.
> 2. Update task status (`[Backlog]` -> `[Ready]` -> `[In Progress]` -> `[Done]`).
> 3. Document every approved technical or architectural decision in the Decision Log below with all necessary context required to reproduce the decision outcome independently.

---

## 🚦 Status Legend
- `[Backlog]` - Captured ideas, unrefined features, or future aspirations from Phase 1 (Idea).
- `[Ready]` - PRD and alignment complete (Phase 4); decomposed into atomic vertical slices (Phase 5); ready for execution.
- `[In Progress]` - Actively being implemented within a single focused session (~100k token Smart Zone).
- `[Blocked]` - Paused due to an external blocker or missing human decision.
- `[Done]` - Fully implemented with TDD, verified via `make check`, and QA complete (Phase 7).

---

## 🗺️ Active Milestones & Epics

### Milestone 1: [Milestone Name / Goal]
- **Target**: [Target Release / Date / Version]
- **Status**: `[In Progress]`
- **Summary**: [High-level summary of the milestone objective and user value]

| ID | Task / Vertical Slice | Phase | Status | Assignee | Spec / Decision Link |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-001** | [Task Title / Vertical Slice 1] | Phase 5-6 | `[Ready]` | [Assignee] | [PRD / Spec Link](file:///docs/workflows/04-prd-and-alignment.md) |
| **TSK-002** | [Task Title / Vertical Slice 2] | Phase 5-6 | `[Backlog]` | [Assignee] | [PRD / Spec Link](file:///docs/workflows/04-prd-and-alignment.md) |

---

## 📋 Task Details & Vertical Slices

### `TSK-001`: [Task Title]
- **Phase**: Phase 5 (Implementation Planning) / Phase 6 (Execution)
- **Status**: `[Ready]`
- **Scope**: [Define the vertical slice: max 3-5 files touched, covering schema/domain -> service -> endpoint/CLI -> tests]
- **Acceptance Criteria**:
  - [ ] Criterion 1 (Given ... When ... Then ...)
  - [ ] Criterion 2
- **Verification Command**: `make check` (or specific test command)

---

## 🧠 Approved Decisions & Reproducibility Log

> **MANDATORY**: Whenever a non-trivial architectural, technical, or scope decision is approved, the agent MUST log it here with full reproducibility context.

### DEC-001: [Descriptive Title of Approved Decision]
- **Date**: YYYY-MM-DD
- **Status**: Approved
- **ADR / Spec Reference**: [Link to ADR or PRD](file:///docs/architecture/0001-template-architecture.md)
- **Context & Drivers**: [What problem, constraints, or trade-offs drove this decision?]
- **Alternatives Evaluated**:
  1. *[Option A]*: [Why evaluated and why rejected]
  2. *[Option B]*: [Why chosen]
- **Decision Outcome**: [Exact approved architecture, API contract, or library choice]
- **Reproducibility Context**: [Exact commands, benchmark numbers, test fixtures, or environment settings needed to independently reproduce and verify this decision outcome]
