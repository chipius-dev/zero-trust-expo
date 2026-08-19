# Phase 3: Prototyping (Exploratory Spikes & Tracer Bullets)

The **Prototyping Phase** creates quick, low-cost, disposable or exploratory implementations ("spikes" or "tracer bullets") to de-risk unknown technical areas, explore user interface patterns, or validate performance hypotheses.

---

## 🎯 Objectives
- Validate technical feasibility with minimal code before committing to a full production architecture.
- Test unfamiliar APIs, third-party libraries, or complex algorithms in isolation.
- Uncover edge cases and architectural friction points early.
- Build confidence in the proposed solution.

---

## 🤖 Agent Operating Guidelines
1. **Explicitly Demarcate Prototype Code**:
   - Spikes should live in temporary branches, scratch spaces, or dedicated prototype modules (e.g. `scratch/` or `experiments/`).
   - Do NOT treat prototype code as production-ready without standard error handling, tests, and refactoring.
2. **Timebox Spikes**:
   - Keep prototype sessions short and laser-focused on resolving specific technical questions.
3. **Capture Lessons Learned**:
   - Document what worked, what failed, and what architectural constraints were discovered.
   - Use prototype findings to inform the PRD (Phase 4) and Technical Design.

---

## 📋 Phase 3 Artifacts & Deliverables
- Working spike / proof-of-concept demonstration.
- Evaluation notes: key takeaways, performance observations, and design insights.
- Readiness to draft a formal PRD with aligned expectations.
