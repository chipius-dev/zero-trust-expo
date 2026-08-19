# Code Review & QA Checklist

Use this checklist during pull request reviews or before marking an agentic task as complete.

---

## 🔍 Pull Request & Change Overview
- **PR / Task Title**: [Title]
- **Author / Assignee**: [Author]
- **Related Spec / Plan**: [Link]

---

## 🛡️ Quality & Architecture Checklist

### 1. Requirements & Design
- [ ] Changes fulfill all requirements specified in the PRD or technical plan.
- [ ] No unintended out-of-scope code or unnecessary refactorings included.
- [ ] Architectural decisions documented in an ADR if major patterns changed.

### 2. Code Quality & Standards
- [ ] Code adheres to project style guide ([`docs/standards/code-style.md`](file:///docs/standards/code-style.md)).
- [ ] Function and variable names are intention-revealing and descriptive.
- [ ] Functions are modular, single-responsibility, and concise.
- [ ] No hardcoded constants, dead code, or unhandled TODOs.

### 3. Error Handling & Resilience
- [ ] Errors are properly typed and caught; no silent error swallowing ([`docs/standards/error-handling.md`](file:///docs/standards/error-handling.md)).
- [ ] Boundary inputs and external responses are strictly validated.
- [ ] Meaningful structured log messages emitted at appropriate log levels.

### 4. Security & Safety
- [ ] Zero committed credentials, tokens, or sensitive information ([`docs/standards/security.md`](file:///docs/standards/security.md)).
- [ ] Inputs are sanitized/parameterized against injection attacks.
- [ ] Dependencies added are strictly necessary and vulnerability-free.

### 5. Testing & Verification
- [ ] Automated tests cover new features, edge cases, and bug fixes ([`docs/standards/testing-strategy.md`](file:///docs/standards/testing-strategy.md)).
- [ ] `make check` passes cleanly with zero warnings or errors.
- [ ] Verification steps documented with reproducible commands.

### 6. AI Platform Agnosticism
- [ ] All documentation remains AI platform agnostic.
- [ ] Platform-specific configs are isolated in [`.agents/`](file:///.agents).
