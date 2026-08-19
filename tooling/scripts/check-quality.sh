#!/usr/bin/env bash
set -euo pipefail

# tooling/scripts/check-quality.sh
# Unified Quality Gate for Agentic SDLC Template

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${REPO_ROOT}"

echo "========================================="
echo "🛡️  Running Agentic SDLC Quality Gate"
echo "========================================="

echo ""
echo "1. Checking Shell Script Syntax..."
find . -name "*.sh" -not -path "./.git/*" | while read -r script; do
    bash -n "$script"
    echo "  ✓ $script syntax valid"
done

echo ""
echo "2. Validating Platform Adapters..."
bash .agents/sync-adapters.sh

echo ""
echo "3. Running Markdown & Documentation Quality Checks..."
python3 tooling/scripts/validate-docs.py

echo ""
echo "========================================="
echo "🎉 Quality Gate Passed: All checks green!"
echo "========================================="
