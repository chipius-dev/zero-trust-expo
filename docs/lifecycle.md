# Lifecycle

One document, because the process is one loop. It replaces the seven phase documents
this template used to carry: an agent will not read 275 lines of playbook before a
task, and the parts that mattered are now checks rather than prose.

The old vocabulary still names real activities - idea, research, prototype, alignment,
planning, execution, QA - but they are not gates. There are exactly **three gates**,
and each one is a command that can fail:

| Gate | Question | Enforced by |
| :--- | :--- | :--- |
| Ready | Has this been interrogated hard enough to build? | `make lint` (L009, L010) |
| Started | Is there one owner, one branch, one item, within WIP? | `make start`, `make check-branch` (L018, L019, L020) |
| Done | Do the tests it promised exist, and is everything derived current? | `make check` (L014, L015, freshness) |

Everything between the gates is judgement, and judgement does not need a document.

## States

See `backlog/SCHEMA.md` for the enum and the rules. In short:

```
draft --(interview)--> ready --(make start)--> in_progress --> done --> archived
                                                    |
                                                    +--> blocked --> in_progress
  any state ------------------------------------------------> dropped --> archived
```

## Gate 1: Ready

Run `make new-item`. It creates a `draft` and prints the interview. The agent's job at
this gate is to **refuse to write a vague item**: hunt the ambiguity, force both the
happy path and the failure modes, demand an observable outcome, and name what is
explicitly out of scope.

An item leaves `draft` only when the body answers every question and the acceptance
criteria read as test names. `make lint` enforces this; a reviewer does not have to.

Research and prototyping happen here when they are needed. A spike is throwaway code
on a throwaway branch, and its output is a decision recorded in
`## Decisions and rejected alternatives`, not a merge.

## Gate 2: Started

```bash
git fetch origin main
make doctor                 # tells you if you are behind before you plan anything
make start ID=ITEM-0007 OWNER=you
git switch -c feature/ITEM-0007-... origin/main
```

`make start` refuses an item that is not `ready` and refuses to exceed the WIP limit.
The branch name, the item ID, the commit trailer and the PR title all carry the same
ID; that linkage is what lets everything else be derived rather than tracked.

Parallel agents: one story per branch, and prefer a worktree per story
(`git worktree add ../repo-ITEM-0007 feature/ITEM-0007-...`) so two agents never share
a working tree. Nothing enforces worktrees; the WIP limit and the branch check are what
keep collisions cheap.

## Gate 3: Done

Test first, and the test's name was already written in the item:

```bash
# 1. RED - write the test named by an acceptance criterion, watch it fail, commit it.
# 2. GREEN - minimal implementation until it passes.
# 3. REFACTOR - clean up with the suite green.
make check                  # freshness + schema + tests, target under 10 seconds
```

Then set `status: done` and run `make archive ID=ITEM-0007`. `make lint` will not let
you call an item done while a promised test is missing from the repo.

See `docs/definition-of-done.md` for the full checklist and which parts CI verifies.

## Worked example

Deliberately shown here as a transcript rather than as seed files in `backlog/`, so
nothing in a freshly instantiated repo can be mistaken for real work.

```console
$ make new-item TYPE=epic TITLE="Token lifecycle"
Created backlog/items/ITEM-0001.md at status 'draft'.
  1. What breaks today, for whom, and how do you know?
  ...

$ make new-item TYPE=story TITLE="Reject expired tokens" PARENT=ITEM-0001
Created backlog/items/ITEM-0002.md at status 'draft'.

$ # answer the interview in the file, then set status: ready
$ make lint
  ERROR L010 backlog/items/ITEM-0002.md: acceptance criterion contains
        unfalsifiable term 'works correctly': "should verify the token works correctly"

$ # rewrite it as a test name, then:
$ make lint
OK: backlog schema clean (2 open, 0 archived, 0 warning(s))

$ make start ID=ITEM-0002 OWNER=agent-a
ITEM-0002 -> in_progress, owner agent-a, branch feature/ITEM-0002-reject-expired-tokens

$ # write the failing test, commit RED, implement, then:
$ make check
OK: generated artifacts are current
OK: backlog schema clean (2 open, 0 archived, 0 warning(s))
check: green

$ # set status: done
$ make archive ID=ITEM-0002
Archived ITEM-0002 into backlog/archive/2026.md and removed backlog/items/ITEM-0002.md.
```

## Speed budget

- `make check` - the inner loop an agent closes without asking a human. Target under
  10 seconds. If it grows past that, move the slow part into `make ci`.
- `make ci` - everything above plus branch and PR naming. Runs on every push and PR.

Anything an agent cannot run itself is not feedback, it is a queue.
