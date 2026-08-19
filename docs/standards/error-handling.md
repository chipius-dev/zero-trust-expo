# Engineering Standards: Error Handling & Resilience

Robust error handling is critical for building production-grade software that fails gracefully, isolates faults, and provides actionable diagnostics.

---

## 🛡️ Error Handling Principles

1. **Fail Fast & Explicitly**:
   - Validate preconditions, arguments, and configuration at boundaries immediately.
   - Do not allow invalid state to propagate deep into business logic.
2. **Never Swallow Errors Silently**:
   - Catching an error without logging, handling, or re-throwing is strictly prohibited (`catch (e) {}` is an anti-pattern).
3. **Use Domain-Specific Error Types**:
   - Create typed error hierarchies (e.g. `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ConflictError`) rather than throwing generic strings or untyped errors.
4. **Preserve Error Context (Causality Chains)**:
   - When wrapping low-level errors into domain errors, preserve the original cause (`new AppError("Failed to fetch order", { cause: err })`).

---

## 📝 Logging & Observability

- **Structured Logging**: Emit structured JSON logs containing timestamp, log level, event name, error stack, and request/trace IDs.
- **Log Levels**:
  - `DEBUG`: Verbose diagnostic information during development.
  - `INFO`: Significant lifecycle milestones (service startup, payment processed).
  - `WARN`: Recoverable anomalies or degraded performance.
  - `ERROR`: Unhandled exceptions, failed transactions, or system faults requiring investigation.
- **Never Log Sensitive Data**: Sanitize passwords, API keys, tokens, PII, and financial data before logging.
