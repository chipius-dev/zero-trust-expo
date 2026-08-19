<!-- GENERATED FILE - DO NOT EDIT. Run `make gen`. Source: backlog/items/*.md -->

# Agent instructions

This repository keeps one set of agent instructions, in `AGENTS.md`. Read it now;
it is short by design. This file exists only because some agent surfaces look for
`CLAUDE.md`, and it is regenerated from `AGENTS.md` by `make gen`.

Start of every session:

```bash
make doctor   # are you current, and is the environment sane?
make status   # what is in flight, what is next
```

Never hand-edit this file. Edit `AGENTS.md` and run `make gen`.
