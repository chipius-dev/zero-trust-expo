# Definition of Done

This is the source for `.github/pull_request_template.md`, which is generated from it
by `make gen`. Edit this file, not the template.

Most of the list is verified by `make ci`. The lines CI cannot verify are marked, and
those are the only ones that depend on honesty.

- [ ] The change is authorised by a `ready` item, and the branch, commits and PR title all carry its ID
- [ ] Every acceptance criterion on the item exists as a real test in the repo
- [ ] Each acceptance test was observed failing before the implementation existed
- [ ] `make check` is green locally, and the same command is green in CI
- [ ] Generated artifacts were regenerated with `make gen` and committed, not hand-edited
- [ ] The item's status is `done` and it has been archived with `make archive`
- [ ] Any architectural decision taken is recorded in an ADR and linked from the item
- [ ] No unrelated file was reformatted and no scope was added beyond the item
- [ ] No secrets, credentials or personal data were committed

## What CI actually proves

| Line | Verified by |
| :--- | :--- |
| Authorised by a ready item, IDs line up | `make check-branch` (L020, and the item must be `in_progress`) |
| Acceptance tests exist | `make lint` L014 |
| Generated artifacts current | `make check` freshness gate |
| Item archived | `make lint` L015 |
| No secrets | `.github/workflows/quality-gate.yml` secret scan step |
| Tests pass | `make test` |

## What CI does not prove, and why

**"Observed failing first."** Coverage of changed lines cannot distinguish test-first
from test-after: both produce identical coverage. The only real evidence is commit
ordering, and a determined author can fake that too. So this template enforces the
part that is honest - *the test named by the acceptance criterion must exist before
the item can be done* - and leaves the red-first observation as a checkbox. Calling a
coverage gate "TDD enforcement" would be theatre; this is where the process asks you
to be honest instead of pretending it can tell.

**Coverage thresholds.** A stack-agnostic template cannot ship a working coverage gate
without knowing the stack. Add one behind `make test` in the instantiated project,
where it can actually run.
