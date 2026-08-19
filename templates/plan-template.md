# Implementation Plan: [Task / Feature Name]

- **Status**: [Draft | In Progress | Completed]
- **Backlog item**: `ITEM-XXXX`
- **Related Spec / PRD**: [Link to PRD]
- **Slices**: [each slice is one story: one branch, one review]

---

## 1. Overview & Objective
[Brief description of the implementation goal and expected outcome.]

---

## 2. Vertical Slice Decomposition

Break the implementation into small, atomic vertical slices (max 3-5 files per slice):

### Slice 1: [Slice Name, e.g., Domain Model & Repository]
- **Files Modified/Created**:
  - `[NEW / MODIFY]` `path/to/file1.ext`
  - `[NEW / MODIFY]` `path/to/file2.ext`
- **Verification Command**: `pytest tests/test_slice1.py`

### Slice 2: [Slice Name, e.g., Service API & Integration Test]
- **Files Modified/Created**:
  - `[NEW / MODIFY]` `path/to/file3.ext`
- **Verification Command**: `pytest tests/test_slice2.py`

---

## 3. Step-by-Step TDD Execution Checklist

- [ ] **Step 1: Write Failing Tests (Red)**
  - Define unit/integration test asserting desired behavior.
  - *Verification*: Test fails as expected.
- [ ] **Step 2: Implement Minimal Code (Green)**
  - Implement the logic to pass the test.
  - *Verification*: Test passes.
- [ ] **Step 3: Refactor & Clean Code**
  - Refactor for readability, modularity, and standards.
  - *Verification*: Tests still pass.
- [ ] **Step 4: Update In-Repo Roadmap & Run Quality Gate**
  - Set the item's status and run `make check`.
  - *Verification*: Quality gate passes 100%.

---

## 4. Decision Outcomes & Reproducibility
- **Approved Decision**: [Details of any architectural decision made during planning]
- **Reproducibility Context**: [Benchmarking results, command steps, or references]
