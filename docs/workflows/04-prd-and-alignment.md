# Phase 4: PRD & Alignment (The "Grill-Me" Shared Design Concept)

The **PRD & Alignment Phase** locks in exact functional requirements, non-functional requirements, and testable acceptance criteria. A critical component of this phase is establishing a **shared design concept** between the human engineer and the AI agent through active alignment techniques (such as "Grill-Me" interviews) before writing production code.

---

## 🎯 Objectives
- Draft a comprehensive Product Requirements Document using [`templates/prd-template.md`](file:///templates/prd-template.md).
- Rigorously interview the developer/stakeholder to uncover unspoken assumptions, edge cases, and architectural constraints.
- Define unambiguous, testable acceptance criteria (Given / When / Then).
- Gain explicit human approval on the PRD before moving to implementation planning.

---

## 🤖 The "Grill-Me" Alignment Protocol
Before finalizing a PRD or design, the AI agent MUST actively interrogate the user on critical design decisions:

1. **State & Data Invariants**:
   - How should invalid state, nulls, or empty datasets be handled?
   - What happens on network disconnects, concurrency collisions, or timeouts?
2. **Boundary & Edge Cases**:
   - What are the minimum and maximum input limits?
   - Are there rate limits, permissions, or security boundaries?
3. **Behavioral Trade-offs**:
   - Favor latency vs. throughput?
   - Strict consistency vs. eventual consistency?
   - Fail-fast vs. fallback degradation?

---

## 🤖 Agent Operating Guidelines
1. **Never Assume Underspecified Details**:
   - If an API or user interaction is ambiguous, formulate 2-3 concrete options with trade-offs and ask for human alignment.
2. **Formulate Testable Scenarios**:
   - Convert every requirement into concrete acceptance tests.
3. **Capture Approved Decisions in the Roadmap**:
   - Log all approved requirements and decision rationale with full context into [`ROADMAP.md`](file:///ROADMAP.md) and [`docs/architecture/`](file:///docs/architecture).

---

## 📋 Phase 4 Checklist & Deliverables
- [ ] PRD authored using [`templates/prd-template.md`](file:///templates/prd-template.md)
- [ ] Alignment interview conducted ("Grill-Me" style)
- [ ] Edge cases, error responses, and state boundaries clarified
- [ ] Explicit Given/When/Then acceptance criteria recorded
- [ ] Human approval obtained and recorded in [`ROADMAP.md`](file:///ROADMAP.md)
