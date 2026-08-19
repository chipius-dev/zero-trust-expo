# PRD: [Feature / Project Name]

- **Author(s)**: [Name / AI Agent]
- **Status**: [Draft | In Review | Approved | Implemented]
- **Parent initiative**: `ITEM-XXXX`
- **Backlog epic**: `ITEM-XXXX`

---

## 1. Problem Statement & Motivation
[Describe the problem this feature solves. Why is it important? Who is affected?]

---

## 2. Target Audience / Personas
- **Primary Persona**: [e.g., End User, Developer, DevOps Engineer]
- **Use Case**: [Primary scenario where this feature is used]

---

## 3. Shared Design Concept & "Grill-Me" Alignment
*(Record the questions, edge cases, and answers established during the alignment interview)*

- **Data Invariants & Null Handling**: [How edge cases and invalid states are handled]
- **Failure Modes & Fallbacks**: [What happens on errors, timeouts, or network loss]
- **Performance & Latency Trade-offs**: [Target latency vs throughput priorities]

---

## 4. Scope & Boundaries

### In Scope
- [Feature capability 1]
- [Feature capability 2]

### Out of Scope (Non-Goals)
- [Explicitly excluded capability 1]
- [Explicitly excluded capability 2]

---

## 5. Functional Requirements

| ID | Requirement | Priority | Description |
| :--- | :--- | :--- | :--- |
| **FR-01** | User Authentication | P0 (Must) | Users must be able to log in securely with OAuth2 / JWT. |
| **FR-02** | Export Data | P1 (Should) | Users can export report data in CSV or JSON format. |

---

## 6. Non-Functional Requirements (NFRs)
- **Performance**: [e.g., p99 latency < 200ms for API calls]
- **Security & Privacy**: [e.g., Data encrypted at rest and in transit]
- **Reliability & Availability**: [e.g., 99.9% uptime SLA]

---

## 7. Acceptance Criteria (Given / When / Then)

```gherkin
Scenario: Successful export of user records
  Given an authenticated admin user
  When the user requests an export of active users
  Then a valid CSV file containing all active user records is returned within 2 seconds
```

---

## 8. Approved Decision Outcomes & Reproducibility Context
- **Approved Decision**: [Key design decision approved during alignment]
- **Reproducibility Context**: [Validation steps, commands, or data models to verify the decision outcome]
