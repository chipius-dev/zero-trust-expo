# Engineering Standards: Code Style & Modularity

This document establishes baseline coding style, readability, and modularity principles applicable across programming languages and frameworks.

---

## 💎 Core Principles

1. **Readability Over Cleverness**:
   - Write obvious, self-documenting code. Favor clear naming and simple control flow over dense one-liners or esoteric language tricks.
2. **Single Responsibility Principle (SRP)**:
   - Every module, class, or function should do one thing well with a singular reason to change.
   - Keep functions concise (ideally under 30-50 lines unless handling an intrinsically sequential pipeline).
3. **Explicit Over Implicit**:
   - Avoid hidden side effects, magical reflection, or implicit global state. Pass dependencies explicitly via constructor/function arguments.
4. **Strong Typing & Static Analysis**:
   - Leverage strict type systems wherever available (TypeScript strict mode, Python type annotations with mypy/pyright, Go types, Rust static types).
   - Avoid `any` / dynamic typing escape hatches unless strictly bounded and documented.

---

## 🏷️ Naming Conventions

- **Variables & Functions**: Descriptive, intention-revealing names (`calculateInvoiceTotal`, `isUserAuthorized`, `fetchActiveSessions`).
- **Booleans**: Prefix with helper verbs (`hasPermission`, `isValid`, `shouldRetry`, `canEdit`).
- **Constants**: UPPERCASE_WITH_UNDERSCORES for compile-time globals (`MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_MS`).
- **File Names**: `kebab-case` for general files/scripts (`check-quality.sh`, `auth-service.ts`) or idiomatic language standard (`snake_case.py`).

---

## 🧱 Modularity & File Organization

- **High Cohesion, Low Coupling**: Keep related logic grouped together; isolate business domains.
- **Directory Structure**: Separate concerns cleanly (e.g. `domain/`, `services/`, `adapters/`, `infrastructure/`, `controllers/`).
- **No Circular Dependencies**: Structure imports in a strictly acyclic hierarchy.
- **Documentation Comments**: Document public interfaces, non-obvious algorithm details, and domain invariants.
