# Agent instructions

Read this file completely before doing anything. It is short on purpose: a rules
file nobody can hold in context is a rules file nobody follows. Everything here is
enforced by `make ci`, so treat a rule you disagree with as a check to argue with,
not a suggestion to skip.

## Every session starts here

```bash
make doctor    # are you current? behind origin? environment sane?
make status    # what is in flight, what is next
```

Never trust conversation memory for repository state. Other humans and other agents
changed things while you were thinking. Re-read `backlog/index.json` from disk.

## The five rules

1. **Status truth lives in `backlog/items/*.md`.** `ROADMAP.md`, `backlog/index.json`,
   `CLAUDE.md` and the PR template are generated. Editing one by hand fails CI.
   Change an item, run `make gen`, commit both.
2. **No work without a `ready` item.** An item reaches `ready` only by surviving the
   interview (`make new-item` prints the questions). Vague items are rejected by
   `make lint`, not by a reviewer's goodwill.
3. **Never commit to `main`.** Branch from freshly fetched `main` as
   `feature/ITEM-0007-short-slug` or `bug/ITEM-0007-short-slug`. `make start ID=...`
   sets this up. Every commit carries the trailer `Item: ITEM-0007`.
4. **Test first, and name the test in advance.** An acceptance criterion *is* a test
   name. Write it failing, commit it, then implement. An item cannot be `done` while
   its acceptance tests do not exist in the repo - `make lint` checks.
5. **`make check` before every push.** It is the same code CI runs. If it is green
   locally and red in CI, that is a bug in the tooling, so report it.

## The loop

```bash
make new-item TYPE=story TITLE="Reject expired tokens" PARENT=ITEM-0001
#   -> creates a draft, prints the interview. Answer it, fill every '## ' section,
#      write real acceptance criteria, set status: ready.
make start ID=ITEM-0002 OWNER=you     # ready -> in_progress, names the branch
#   -> write the failing test named by an acceptance criterion. Commit it RED.
#   -> implement until green. Refactor.
make check                            # freshness + schema + tests, under 10s
#   -> set status: done, then:
make archive ID=ITEM-0002             # rolls into backlog/archive/, frees nothing
```

`make help` lists every verb. Nothing agent-facing should require inventing a
command line; if you find yourself doing that, the gap is a bug worth an item.

## Scope discipline

One story is one branch and one review. If you cannot land it that way, it is too
big: split it into more stories under the same epic. WIP limit is 3 in-progress
items across the whole repo, counted by `make lint`.

Do not opportunistically reformat untouched files, and do not widen a change beyond
the item that authorises it.

## Where things are

| Path | What | Read it when |
| :--- | :--- | :--- |
| `backlog/SCHEMA.md` | The item contract and every lint code | An item fails lint |
| `backlog/index.json` | Machine-readable state, generated | You need status cheaply |
| `docs/lifecycle.md` | The states, the gates, a worked example | You are unsure of the process |
| `docs/definition-of-done.md` | What "done" means, mostly CI-verified | Before you claim done |
| `docs/standards/` | Style, errors, testing, security | You are writing code |
| `docs/architecture/` | ADRs. Cite them, do not silently re-decide | You are making a design choice |
| `sdlc.config.json` | WIP limit, ID prefix, test globs | You are tuning the process |
| `tooling/src/` | The checks themselves | A check is wrong |

Architecture decisions belong in an ADR (`templates/adr-template.md`), referenced
from the item's `## Links`. An agent should be citing architecture, not inventing it.
