# Phase 5: Implementation Planning (In-Repo Roadmap & Vertical Slices)

The **Implementation Planning Phase** decomposes the approved PRD into a sequence of small, atomic, independently testable **vertical slices**. It manages these tasks in an in-repository Kanban roadmap ([`ROADMAP.md`](file:///ROADMAP.md)), ensuring every task stays within the optimal AI "Smart Zone".

---

## 🎯 Objectives
- Decompose complex systems into small, independently shippable vertical slices.
- Record tasks and track progress on the in-repo [`ROADMAP.md`](file:///ROADMAP.md).
- Keep task scope sized appropriately for the AI **Smart Zone** (~100k tokens per execution session).
- Define concrete verification commands for each atomic step.

---

## 🍕 Vertical Slices vs. Horizontal Layers

```
Horizontal Layering (Anti-Pattern for Agents):
❌ Step 1: Write all DB schemas for all features
❌ Step 2: Write all backend services for all features
❌ Step 3: Write all frontend UI for all features
(Causes context window bloat, huge diffs, and delayed end-to-end feedback)

Vertical Slicing (Recommended Pattern):
✅ Slice 1: User Login (Schema -> Service -> Endpoint -> Test -> Verified)
✅ Slice 2: User Profile View (Schema -> Service -> Endpoint -> Test -> Verified)
✅ Slice 3: User Profile Edit (Schema -> Service -> Endpoint -> Test -> Verified)
(Enables short sessions, isolated commits, and immediate working software)
```

---

## 🧠 The AI "Smart Zone" Rule
- Large context windows suffer from attention degradation ("lost in the middle", hallucinations, missed instructions) when context exceeds ~100k tokens.
- **Rule**: Each task in [`ROADMAP.md`](file:///ROADMAP.md) should be executable in a single focused session.
- Break large features into discrete vertical slice tasks that touch no more than 3-5 related files at a time.

---

## 📋 Phase 5 Checklist & Deliverables
- [ ] Technical plan drafted using [`templates/plan-template.md`](file:///templates/plan-template.md)
- [ ] Tasks broken into vertical slices and added to [`ROADMAP.md`](file:///ROADMAP.md) under `[Ready]`
- [ ] Each task has explicit verification commands and acceptance criteria
- [ ] Architectural decisions documented in an ADR ([`templates/adr-template.md`](file:///templates/adr-template.md))
- [ ] Human approval obtained on the implementation plan
