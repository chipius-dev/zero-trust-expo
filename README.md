# Zero Trust Expo Template

## Getting started

```bash
make help      # every verb
make doctor    # is this environment sane, are you current with origin
make status    # what is in flight, what is next
```

## How work happens here

Work is tracked in `backlog/items/`, one file per item, and that is the only place
status is stored. `ROADMAP.md` and `backlog/index.json` are generated from it by
`make gen`; editing them by hand fails CI.

- Agents: read [AGENTS.md](AGENTS.md) first.
- The process, its three gates, and a worked example: [docs/lifecycle.md](docs/lifecycle.md).
- The item contract and every lint code: [backlog/SCHEMA.md](backlog/SCHEMA.md).
- What "done" means: [docs/definition-of-done.md](docs/definition-of-done.md).

## Requirements

Node 22.18+ (the process tooling runs TypeScript directly, with no build step), git,
and make. Add this project's own stack requirements below.

## License

See [LICENSE](LICENSE).
