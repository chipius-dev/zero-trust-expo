#!/usr/bin/env bash
set -euo pipefail

# .agents/sync-adapters.sh
# Utility script to inspect, validate, and optionally link platform-specific adapters to root.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

echo "🔄 Validating AI platform adapters..."

ADAPTERS=("antigravity" "cursor" "claude" "copilot" "windsurf")
MISSING=0

for adapter in "${ADAPTERS[@]}"; do
    if [ -d ".agents/${adapter}" ]; then
        echo "  ✓ Found adapter for ${adapter}"
    else
        echo "  ✗ Missing adapter directory for ${adapter}"
        MISSING=$((MISSING + 1))
    fi
done

if [ "$MISSING" -gt 0 ]; then
    echo "⚠️ Some adapters are missing!"
    exit 1
fi

echo "✨ All platform adapters verified successfully."
