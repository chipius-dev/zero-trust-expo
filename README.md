# Agentic SDLC template

A template repository for projects built mostly by agents. It ships a backlog under
source control, a generated status dashboard, and a set of checks that fail loudly
when the process is ignored.

The premise: guardrails beat guidance. Anything this template asks you to do, it also
checks. Anything it cannot check, it says so out loud rather than pretending.

[![Quality Gate](https://github.com/chipius-dev/agentic-sldc-template/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/chipius-dev/agentic-sldc-template/actions/workflows/quality-gate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Start here

```bash
make help      # every verb
make doctor    # is this environment sane, are you current with origin
make status    # what is in flight, what is next
```

Agents read [AGENTS.md](AGENTS.md). It is deliberately short. `CLAUDE.md` is generated
from it, so per-surface rules files cannot drift; adding another agent surface means
adding a renderer, never a second copy of the rules.

## What is actually enforced

| Invariant | Enforcement |
| :--- | :--- |
| One source of truth for status | `ROADMAP.md`, `backlog/index.json`, `CLAUDE.md` and the PR template are generated; hand-editing any of them fails `make check` |
| No vague work items | `make lint` rejects an item promoted past `draft` without scope, exclusions, decisions, and falsifiable acceptance criteria |
| Acceptance criteria that can fail | Criteria must read as test names; "works correctly" is rejected by name |
| "Done" means tested | An item cannot be `done` while a promised test is absent from the repo |
| Stable, never-reused IDs | IDs appear in branch names, commit trailers and PR titles; archived rows keep every ID forever |
| Branch discipline | CI rejects a branch or PR title that does not carry a live, in-progress item ID |
| WIP limit | Counted by `make lint`, not by hoping |
| Status matching reality | The dashboard lists items whose status contradicts git |
| Docs that point at real files | Broken and `file://` links fail the build |
| The template itself works | CI drives the whole loop end to end in a temporary repo |

## Layout

```
AGENTS.md                  Agent contract. Short. The one instruction file.        (agent)
CLAUDE.md                  Generated pointer to AGENTS.md.                          (agent, generated)
ROADMAP.md                 Generated dashboard. Never hand-edited.                  (human, generated)
sdlc.config.json           WIP limit, ID prefix, test globs. The stack seam.        (agent, CI)
Makefile                   One verb per intent. CI calls these exact targets.       (all)

backlog/
  SCHEMA.md                The item contract and every lint code.                   (agent)
  items/<ID>.md            Source of truth for status. One file per item.           (all)
  archive/<YYYY>.md        Rollup of closed items; keeps IDs from being reused.     (all)
  index.json               Generated machine index: "what should I work on?"        (agent, generated)

docs/
  lifecycle.md             The three gates and a worked example.                    (human, agent)
  definition-of-done.md    Source for the PR template; says what CI cannot prove.   (human, agent)
  standards/               Style, error handling, testing, security.                (human, agent)
  architecture/            ADRs. Cite them instead of re-deciding.                  (human, agent)

templates/                 PRD, plan, ADR, RFC skeletons.                           (human)
tooling/
  src/                     The checks. Zero dependencies, Node >= 22.18.            (CI, agent)
  test/                    Tests for the checks, including the template self-test.  (CI)
  hooks/pre-push           Client-side guard. CI enforces the same rules anyway.    (human)
  init.sh                  Strips template framing from a new project.              (human)
.github/
  workflows/quality-gate.yml   Calls `make ci`. No logic of its own.                (CI)
  rulesets/main.json           Branch protection to import; a template cannot force it. (human)
  pull_request_template.md     Generated from the Definition of Done.               (human, generated)
```

Files marked *(human)* exist only for people: `templates/` and `docs/standards/` are
reference material an agent reads on demand rather than every session, and
`rulesets/main.json` is something a person must apply in the forge UI.

## Requirements

- **Node 22.18+ or 24+.** The tooling is TypeScript executed directly by Node's native
  type stripping. There is no build step, no `node_modules`, and no lockfile.
- **git** and **make**.

Nothing else. The instantiated project brings its own stack; the process layer does not
care what it is.

## After instantiating

```bash
make init NAME="Your project"   # rewrites this README, keeps the machinery
make hooks                      # optional client-side pre-push guard
make check                      # should be green on an empty backlog
```

Then apply `.github/rulesets/main.json` in Settings > Rules and require the
`quality-gate` check. Until you do, `main` is protected by convention only - `make doctor`
will keep saying so.

## Extending

- **A different stack**: point `testGlobs` in `sdlc.config.json` at your test files and
  add your language's real test command behind `make test`. Nothing else is stack-bound.
- **Another agent surface**: add a renderer in `tooling/src/generate.ts`. Never add a
  second rules file.
- **Different process knobs**: WIP limit, ID prefix, dashboard size and context cap all
  live in `sdlc.config.json`.

## License

MIT. See [LICENSE](LICENSE).
