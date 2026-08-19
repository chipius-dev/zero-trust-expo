# Roadmap Task & Decision Template

Use this template when breaking down tasks into vertical slices in [`ROADMAP.md`](file:///ROADMAP.md) or creating task tickets.

---

## 📌 Task Summary
- **Task ID**: TSK-XXX
- **Title**: [Descriptive Task Title]
- **Milestone / Epic**: [Milestone Name]
- **SDLC Phase**: [Phase 1..7]
- **Status**: `[Backlog]` | `[Ready]` | `[In Progress]` | `[Blocked]` | `[Done]`
- **Assignee**: [Human Developer / AI Agent]
- **Related PRD / ADR**: [Link to PRD or ADR]

---

## 🎯 Scope & Vertical Slice Definition
[Describe the specific slice of functionality to implement: Schema -> Service -> API/CLI -> Test]

### Files Impacted (Max 3-5 files per slice):
- `path/to/file1.ext`
- `path/to/file2.ext`

---

## 🧪 Acceptance & Verification Criteria
- [ ] Requirement 1: [Given ... When ... Then ...]
- [ ] Requirement 2: [Given ... When ... Then ...]
- [ ] Automated Test Command: `pytest tests/test_slice.py` or `npm test`
- [ ] Quality Gate: `make check`

---

## 🧠 Approved Decision Outcome & Reproducibility Context
*(Fill when this task resolves a key architectural or technical decision)*

- **Decision Summary**: [Approved outcome]
- **Drivers & Trade-offs**: [Why this was chosen over alternatives]
- **Reproducibility Context**: [Commands, benchmarks, or test cases that prove the validity of the decision]
