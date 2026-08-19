.PHONY: help check lint format test validate sync-adapters

# Default target
all: check

help:
	@echo "Agentic SDLC Template - Available Commands:"
	@echo "  make check           - Run all repository quality, link, and structure checks"
	@echo "  make lint            - Run linters on documentation and scripts"
	@echo "  make format          - Check/format documents and scripts"
	@echo "  make test            - Run all test suites and automated verifications"
	@echo "  make validate        - Validate documentation links and structure"
	@echo "  make sync-adapters   - Sync / verify platform-specific AI adapters"

check: validate test
	@echo "✅ All quality checks passed!"

validate:
	@bash tooling/scripts/check-quality.sh

lint: validate

format:
	@echo "Checking formatting..."
	@bash tooling/scripts/check-quality.sh

test:
	@python3 tooling/scripts/validate-docs.py

sync-adapters:
	@bash .agents/sync-adapters.sh
