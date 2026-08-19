# Engineering Standards: Security & Defensive Coding

Security must be built into every stage of the agentic SDLC rather than treated as an afterthought.

---

## 🔒 Core Security Principles

1. **Defense in Depth**:
   - Apply security controls at multiple architectural layers (network, gateway, application authentication, authorization, database).
2. **Principle of Least Privilege**:
   - Grant users, services, and background workers only the minimum permissions required to perform their functions.
3. **Never Trust User Input**:
   - Validate and sanitize all incoming payloads at system boundaries.
   - Use parameterized queries / ORMs to prevent SQL/NoSQL injections.
   - Encode output to prevent Cross-Site Scripting (XSS).

---

## 🔑 Secrets & Credentials

- **Zero Hardcoded Secrets**: Never commit passwords, tokens, API keys, certificates, or private keys to source control.
- **Environment Configuration**: Load credentials at runtime via environment variables or secure secret managers (e.g. AWS Secrets Manager, HashiCorp Vault).
- **Secret Scanning**: Use automated tools (e.g., git-secrets, gitleaks) in pre-commit hooks and CI pipelines.

---

## 📦 Dependency & Supply Chain Security

- **Vulnerability Audits**: Regularly run automated security audits (e.g. `npm audit`, `pip-audit`, `cargo audit`, Dependabot/Renovate).
- **Pin Dependencies**: Lock dependency versions via lockfiles (`package-lock.json`, `uv.lock`, `Cargo.lock`, `go.sum`).
- **Minimal Dependencies**: Favor standard libraries and well-maintained packages; avoid bloat from unnecessary micro-packages.
