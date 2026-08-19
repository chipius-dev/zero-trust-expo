# GitHub Copilot Adapter

This adapter configures **GitHub Copilot** custom workspace instructions for this repository.

---

## Usage

Link `.github/copilot-instructions.md` to this adapter:
```bash
mkdir -p .github
ln -sf ../.agents/copilot/copilot-instructions.md .github/copilot-instructions.md
```
Or run `bash .agents/sync-adapters.sh`.
