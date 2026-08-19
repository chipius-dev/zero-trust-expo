#!/usr/bin/env python3
"""
Documentation and Repository Quality Validator
Validates markdown structure, internal link integrity, and platform-agnostic compliance.
"""

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# Vendor-specific keywords that MUST NOT appear in core docs/ and templates/
FORBIDDEN_VENDOR_PATTERNS = [
    r"\bcursorrules\b",
    r"\bclaude\.md\b",
    r"\bwindsurfrules\b",
    r"\bgemini-extension\b",
]

def find_markdown_files(root: Path):
    md_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Exclude .git
        if ".git" in dirnames:
            dirnames.remove(".git")
        for f in filenames:
            if f.endswith(".md"):
                md_files.append(Path(dirpath) / f)
    return sorted(md_files)

def validate_links(file_path: Path, all_files: set) -> list:
    errors = []
    content = file_path.read_text(encoding="utf-8")
    
    # Match markdown links: [text](link)
    link_pattern = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
    for match in link_pattern.finditer(content):
        link_target = match.group(2).strip()
        
        # Skip external URLs or anchor-only links
        if link_target.startswith(("http://", "https://", "mailto:", "#")):
            continue

        # Handle file:/// URIs
        clean_target = link_target
        if clean_target.startswith("file:///"):
            clean_target = clean_target[len("file:///"):]
            target_path = REPO_ROOT / clean_target
        elif clean_target.startswith("/"):
            target_path = REPO_ROOT / clean_target.lstrip("/")
        else:
            target_path = file_path.parent / clean_target

        # Remove anchor # if present
        target_str = str(target_path).split("#")[0]
        resolved_path = Path(target_str).resolve()

        if not resolved_path.exists():
            errors.append(f"Broken link in {file_path.relative_to(REPO_ROOT)}: '{link_target}' -> {target_path} not found")

    return errors

def validate_platform_agnostic(file_path: Path) -> list:
    errors = []
    rel_path = file_path.relative_to(REPO_ROOT)
    
    # Only check docs/ and templates/ (exclude .agents/ and README.md / AGENTS.md indexes)
    str_rel = str(rel_path)
    if not (str_rel.startswith("docs/") or str_rel.startswith("templates/")):
        return errors

    content = file_path.read_text(encoding="utf-8").lower()
    for pattern in FORBIDDEN_VENDOR_PATTERNS:
        if re.search(pattern, content):
            errors.append(
                f"Platform-agnostic violation in {rel_path}: Contains proprietary tool marker '{pattern}'"
            )

    return errors

def validate_roadmap_rules(root: Path) -> list:
    errors = []
    roadmap_path = root / "ROADMAP.md"
    if not roadmap_path.exists():
        errors.append("Mandatory in-repo roadmap missing: ROADMAP.md must exist in root.")
        return errors
    
    content = roadmap_path.read_text(encoding="utf-8")
    required_sections = [
        "Status Legend",
        "Active Milestones & Epics",
        "Approved Decisions & Reproducibility Log",
    ]
    for section in required_sections:
        if section not in content:
            errors.append(f"ROADMAP.md missing required section: '{section}'")
            
    return errors

def main():
    print(f"🔍 Validating repository at {REPO_ROOT}...")
    md_files = find_markdown_files(REPO_ROOT)
    all_files_set = {f.resolve() for f in md_files}

    total_errors = []

    # Validate mandatory roadmap
    roadmap_errors = validate_roadmap_rules(REPO_ROOT)
    total_errors.extend(roadmap_errors)

    print(f"📄 Found {len(md_files)} markdown documents.")

    for md_file in md_files:
        link_errors = validate_links(md_file, all_files_set)
        total_errors.extend(link_errors)

        agnostic_errors = validate_platform_agnostic(md_file)
        total_errors.extend(agnostic_errors)

    if total_errors:
        print("\n❌ Quality validation failed with the following errors:")
        for err in total_errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("✅ All markdown files, links, roadmap rules, and platform-agnostic checks passed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
