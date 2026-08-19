# Canonical entrypoints. Every verb below runs the same code locally and in CI,
# so "green on my machine" and "green in CI" cannot mean different things.
# The implementation lives in tooling/src/cli.ts (zero dependencies, Node >= 22.18).

NODE := node
CLI  := $(NODE) tooling/src/cli.ts
export ID TYPE TITLE PARENT OWNER BRANCH PR_TITLE

.PHONY: help doctor status gen lint test check ci new-item start archive check-branch hooks init

help:
	@echo "Start of session"
	@echo "  make doctor            Are you current and is the environment sane?"
	@echo "  make status            What is in flight, what is next (cheap)"
	@echo ""
	@echo "Working"
	@echo "  make new-item TYPE=story TITLE=\"...\" PARENT=ITEM-0001   Author an item (starts at draft)"
	@echo "  make start ID=ITEM-0002 OWNER=you                        Ready -> in progress, names the branch"
	@echo "  make archive ID=ITEM-0002                                Roll a done/dropped item into the archive"
	@echo ""
	@echo "Verifying (run before every push)"
	@echo "  make check             Freshness + backlog schema + tests. The inner loop."
	@echo "  make ci                Everything CI runs, including branch and PR naming."
	@echo ""
	@echo "Plumbing"
	@echo "  make gen               Regenerate ROADMAP.md, backlog/index.json, CLAUDE.md, PR template"
	@echo "  make lint              Backlog schema and git-reality findings only"
	@echo "  make test              Tooling test suite"
	@echo "  make hooks             Install the client-side pre-push guard"
	@echo "  make init NAME=...     Strip template framing from a freshly instantiated repo"

doctor:
	@$(CLI) doctor

status:
	@$(CLI) status

gen:
	@$(CLI) gen

lint:
	@$(CLI) lint

test:
	@$(NODE) --test "tooling/test/*.test.ts"

# The inner loop. Target: under 10 seconds. Anything slower belongs in `ci`.
check:
	@$(CLI) check-fresh
	@$(CLI) lint
	@$(MAKE) --no-print-directory test
	@echo "check: green"

# What CI runs. Identical to `check` plus the checks that need CI context.
ci: check check-branch
	@echo "ci: green"

check-branch:
	@$(CLI) check-branch

new-item:
	@$(CLI) new-item

start:
	@$(CLI) start

archive:
	@$(CLI) archive

hooks:
	@mkdir -p .git/hooks
	@cp tooling/hooks/pre-push .git/hooks/pre-push
	@chmod +x .git/hooks/pre-push
	@echo "installed .git/hooks/pre-push (client-side; CI enforces the same rules regardless)"

init:
	@bash tooling/init.sh
