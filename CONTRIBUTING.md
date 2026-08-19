# Contributing

The rules for humans and agents are the same, and they live in one place:
[AGENTS.md](AGENTS.md). This file exists because the forge links to it from the PR
view; it deliberately repeats nothing.

Before you open a pull request:

```bash
make doctor    # are you current with origin/main
make check     # freshness, backlog schema, tests
```

The Definition of Done is in [docs/definition-of-done.md](docs/definition-of-done.md),
and the PR template is generated from it. The item contract and every lint code are in
[backlog/SCHEMA.md](backlog/SCHEMA.md).

If a check is wrong, change the check and say why in the item. Do not route around it.
