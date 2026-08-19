# Backlog item schema

One file per work item, in `backlog/items/<ID>.md`. Plain text, diffable, reviewable
in a PR, and the only place status is stored. Closed items roll up into
`backlog/archive/<YYYY>.md`.

Everything below is enforced by `make lint`. Each rule has a code so a failure can be
argued with rather than guessed at.

## Front matter

The grammar is a deliberately small subset of YAML: `key: value` and `key:` followed
by `  - item`. No nesting, no anchors, no block scalars. Anything else is a parse
error, so two agents cannot read the same file two ways.

```
---
id: ITEM-0007                      # required. Allocated by `make new-item`. Never reused.
title: "Reject expired tokens"     # required. 1-80 characters.
type: story                        # required. initiative | epic | story
status: ready                      # required. See states below.
created: 2026-08-19                # required. ISO date.
parent: ITEM-0003                  # required for a story; forbidden on an initiative.
owner: agent-a                     # required once in_progress.
branch: feature/ITEM-0007-reject-expired-tokens
acceptance:                        # test names that will exist. Required for a ready story.
  - "should reject the request when the token is expired"
  - "should emit an audit record when a token is refused"
blocked_by:                        # required when status is blocked.
  - ITEM-0004
dropped_reason: "Superseded by ITEM-0011: the gateway now handles this."
labels:
  - security
---
```

The schema is **closed**: an unrecognised key is an error (L017), because a key the
tooling ignores is a rule nobody enforces.

## States

| Glyph | Status | Meaning | Leaves this state when |
| :-: | :--- | :--- | :--- |
| `o` | `draft` | Captured, **not yet interrogated**. Allowed to be vague. | It survives the interview |
| `*` | `ready` | Interrogated. Anyone may pick it up. | `make start` |
| `>` | `in_progress` | Someone owns it and a branch exists. | Work lands or stalls |
| `!` | `blocked` | Waiting on something named in `blocked_by`. | The blocker clears |
| `x` | `done` | Acceptance tests exist and pass. | Archived |
| `-` | `dropped` | Wrong item. Closed with a reason, never deleted. | Archived |

There is deliberately **no `awaiting_review` status**. It is derived from git - an
in-progress item whose branch carries commits not on the default branch - and shown
in the dashboard's `Review` column. Storing it would create a second source of truth
that drifts the moment a PR opens or merges.

## The interview gate (L009, L010)

An item may not leave `draft` until it answers these in its body. `make new-item`
prints the questions; `make lint` refuses the promotion until they are answered.

Required sections: `## Why`, `## Scope`, `## Out of scope`, `## Constraints`,
`## Decisions and rejected alternatives`, `## Links`.

- `## Out of scope` must name at least one real exclusion. An item that excludes
  nothing has not been scoped.
- `## Decisions and rejected alternatives` must record at least one decision *with
  the alternative that was rejected and why*. This is the part that survives after
  the chat window is gone.
- The whole body is capped at 120 lines (`maxContextLines`). This is a briefing, not
  a transcript.

## Acceptance criteria are test names (L010, L014)

A criterion must read as the name of a test that will exist: it contains `should`, is
at least five words, and contains none of the unfalsifiable terms (`works correctly`,
`properly`, `robust`, `intuitive`, ...). "Works correctly" is a rejected criterion
because nothing can make it fail.

An item cannot be `done` while any of its acceptance criteria has no matching test in
the paths listed under `testGlobs` in `sdlc.config.json` (L014). That is the honest
link between a claim and reality; it is a substring match, so it works in any language.

## IDs

Allocated by `make new-item` as `max(existing live, existing archived) + 1`, zero
padded to four digits. Archived rows keep every ID forever, so an ID freed by closing
an item is never handed out again (L003).

Two agents authoring at the same instant can mint the same number. That is caught, not
prevented: the uniqueness rule fails in CI on the second PR, and the fix is to rename
the file and its references. Making the mint atomic would need a lock the forge cannot
give us offline.

## Closing an item

Set `status: done` or `status: dropped` (with `dropped_reason`), then run
`make archive ID=...`. Live `done` items are a lint error (L015): closed work belongs
in the rollup so the in-flight view stays cheap.

**Never delete an item file to make it go away.** An item that turned out to be wrong
is `dropped` with a reason, so the next person does not re-propose it.

## Lint codes

| Code | Rule |
| :--- | :--- |
| L000 | Front matter does not parse |
| L001 | Filename does not match `id` |
| L002 | Malformed ID |
| L003 | Duplicate or reused ID |
| L004 | Missing required key |
| L005 | Value outside a closed enum |
| L006 | Illegal or missing parentage |
| L007 | Title missing or over 80 characters |
| L008 | `created` is not an ISO date |
| L009 | Interview gate: missing or empty required section |
| L010 | Acceptance criterion missing, too short, or unfalsifiable |
| L011 | `blocked` without `blocked_by` |
| L012 | `dropped` without `dropped_reason` |
| L013 | Context record over the line cap |
| L014 | `done` with an acceptance criterion that has no matching test |
| L015 | Closed item still living in `backlog/items/` |
| L016 | Archive row with a non-closed status |
| L017 | Unknown front-matter key |
| L018 | Over the WIP limit |
| L019 | `in_progress` without an owner |
| L020 | Branch name that does not match the convention or carry the ID |
| G001 | `in_progress` but no branch carries the ID (warning) |
| G002 | `in_progress` but no commit carries the `Item:` trailer (warning) |
| G003 | Archived as done but the branch still has unmerged commits (warning) |
| G004 | `blocked_by` names an item that does not exist (warning) |
| D001 | A document links to a path that does not exist (error) |

`L*` codes are errors and fail the build. `G*` codes are warnings: git and the backlog
disagree, which is information a human should see rather than a reason to block a push.
