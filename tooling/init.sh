#!/usr/bin/env bash
# Bootstrap a freshly instantiated repository.
#
# Idempotent by design: it detects whether the template framing is still present and
# does nothing on a second run. It removes template-about-itself content and leaves the
# machinery. It never deletes backlog items, because there are none to delete - this
# template deliberately ships an empty backlog so no example can be mistaken for real
# work (the worked example lives as a transcript in docs/lifecycle.md).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

NAME="${NAME:-}"
MARKER="# Agentic SDLC template"

if ! head -n 1 README.md | grep -qF "$MARKER"; then
  echo "init: README.md is no longer the template's own; nothing to do."
  echo "init: re-running is safe and this is what a second run looks like."
  exit 0
fi

if [ -z "$NAME" ]; then
  echo "init: NAME is required, e.g. make init NAME=\"Order service\"" >&2
  exit 1
fi

cat > README.md <<EOF
# ${NAME}

## Getting started

\`\`\`bash
make help      # every verb
make doctor    # is this environment sane, are you current with origin
make status    # what is in flight, what is next
\`\`\`

## How work happens here

Work is tracked in \`backlog/items/\`, one file per item, and that is the only place
status is stored. \`ROADMAP.md\` and \`backlog/index.json\` are generated from it by
\`make gen\`; editing them by hand fails CI.

- Agents: read [AGENTS.md](AGENTS.md) first.
- The process, its three gates, and a worked example: [docs/lifecycle.md](docs/lifecycle.md).
- The item contract and every lint code: [backlog/SCHEMA.md](backlog/SCHEMA.md).
- What "done" means: [docs/definition-of-done.md](docs/definition-of-done.md).

## Requirements

Node 22.18+ (the process tooling runs TypeScript directly, with no build step), git,
and make. Add this project's own stack requirements below.

## License

See [LICENSE](LICENSE).
EOF

# The template's own architecture decision is history, not this project's.
rm -f docs/architecture/0001-template-architecture.md docs/architecture/0002-process-as-checks.md

echo "init: rewrote README.md for '${NAME}'"
echo "init: removed the template's own ADRs from docs/architecture/"
echo
echo "Still to do by hand:"
echo "  1. Apply .github/rulesets/main.json in Settings > Rules, require the 'quality-gate' check."
echo "  2. Point testGlobs in sdlc.config.json at this project's tests."
echo "  3. Put this project's real test command behind 'make test'."
echo "  4. Run 'make gen && make check', then commit."
