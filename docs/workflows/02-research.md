# Phase 2: Research (Targeted Discovery & Feasibility)

The **Research Phase** is an optional or targeted investigation to gather crucial technical context, evaluate external libraries, explore architectural patterns, or analyze existing codebase constraints before committing to a design.

---

## 🎯 Objectives
- Explore existing codebase patterns, interfaces, and dependencies to avoid reinventing wheels.
- Evaluate candidate third-party libraries, external APIs, and technical trade-offs.
- Identify architectural constraints, security considerations, and potential bottlenecks.
- Prevent AI hallucination by establishing verified facts from official documentation.

---

## 🤖 Agent Operating Guidelines
1. **Targeted, Bounded Research**:
   - Keep research focused on specific unknowns rather than unbounded context gathering.
   - Respect the **Smart Zone**: Avoid bloating conversation context with massive dumps of raw text; summarize key findings.
2. **Explore the Local Codebase First**:
   - Inspect existing abstractions, data structures, and helper functions in the repository.
3. **Document Findings with Reproducibility Context**:
   - Log URLs, API specifications, benchmark commands, and version constraints discovered.
   - Record findings in an RFC draft or directly update the task ticket in [`ROADMAP.md`](file:///ROADMAP.md).

---

## 📋 Phase 2 Artifacts & Deliverables
- Research summary / technical comparison table.
- Trade-off matrix (pros/cons of candidate approaches).
- Decision to proceed to Prototyping (Phase 3) or PRD (Phase 4).
