# ADR 0002: The process is a set of checks, not a set of documents

- **Status**: Accepted
- **Date**: 2026-08-19
- **Supersedes**: parts of [ADR 0001](0001-template-architecture.md)
- **Backlog item**: none (this change predates the backlog it introduces)

## 1. Context and problem statement

The first version of this template expressed its process as prose: seven workflow
documents, five near-identical vendor rules files, and a `ROADMAP.md` maintained by
hand. The only automated checks were shell syntax on two scripts, five
directory-existence assertions, markdown link resolution, three required heading
strings, and four forbidden substrings.

The consequence was that `make check` passed, green, on a repository containing no real
content and no real work. Nothing could detect a vague work item, a status that
contradicted git, a hand-edited dashboard, a branch that referenced nothing, or an
acceptance criterion that could not fail. The rules existed; the enforcement did not.

Three specific defects made the point concretely: `ROADMAP.md` and
`templates/roadmap-template.md` were byte-identical, `README.md` documented a
`tooling/hooks/` directory that did not exist, and `.agents/sync-adapters.sh` - named
"sync" - synchronised nothing and left every agent adapter inert.

## 2. Decision drivers

- An agent with no conversation history must do the right thing from repo contents alone.
- Two different agents must produce the same reading of the same backlog state.
- Ignoring a practice must make something turn red automatically. Otherwise it is decoration.
- "What is the status?" must not cost a glob of the whole backlog.
- The core must survive instantiation as a Python service, a Go CLI or a TypeScript monorepo.

## 3. Considered options

1. **Keep the prose, add more of it.** Cheapest, and it fails every driver above. The
   existing prose was already unread and already contradicted itself in three places.
2. **Keep `ROADMAP.md` as the source of truth, add a parser.** Fewer moving parts, and
   a single markdown table is a merge-conflict machine as soon as two agents work in
   parallel. Rejected for that reason, not for elegance.
3. **One file per item, everything else generated, every rule a check.** Chosen.
4. **An external tracker with a sync job.** Rejected: two sources of truth by
   construction, and it breaks offline determinism.

## 4. Decision outcome

**Option 3.** Status truth lives in `backlog/items/<ID>.md`. Closed items roll up into
`backlog/archive/<YYYY>.md`, which keeps the in-flight view cheap while guaranteeing IDs
are never reused. `ROADMAP.md`, `backlog/index.json`, `CLAUDE.md` and the PR template are
generated in one pass and fail the build if hand-edited.

Every rule the old documents asserted is now a lint code (`backlog/SCHEMA.md`), and CI
calls the same `make` targets a developer runs, so local green and CI green cannot mean
different things.

### Consequences

- Seven workflow documents collapsed to one; five vendor rules files collapsed to one
  generated pointer. Roughly 900 lines of prose removed, ~1,400 lines of checks and
  tests added.
- The process now has a runtime dependency: Node 22.18+. Chosen because native type
  stripping means TypeScript with no build step, no `node_modules` and no lockfile.
- `awaiting_review` is derived from git rather than stored, because storing it would
  recreate the second source of truth this ADR exists to remove.
- The dashboard's "as of" is a digest of backlog content, not the last backlog commit
  sha. The sha was tried first and is wrong: committing an item together with its
  regenerated dashboard changes that sha, so the dashboard is stale the instant it
  lands and CI fails on every pull request that touches the backlog. A regression test
  covers it (`committing the backlog should not make the dashboard stale`).
- Enforcement is genuinely split: CI checks cannot be skipped, the pre-push hook can be,
  and branch protection is a forge setting a template cannot force a fork to enable.
  `make doctor` reports that last gap out loud rather than implying it is handled.

## 5. Reproducibility

```bash
make check        # freshness gate, backlog schema, doc links, tooling tests
make ci           # the above plus branch and PR naming
node --test "tooling/test/*.test.ts"   # includes a self-test that drives the whole
                                       # loop end to end in a temporary repository
```

The claim that the previous quality gate passed on empty content is reproducible at
commit `e729664` by running `make check` on a clean checkout.
