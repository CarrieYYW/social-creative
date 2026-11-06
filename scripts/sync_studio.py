#!/usr/bin/env python3
"""Copy the canonical Studio kit and brief template so each skill stays self-contained."""

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "skills/video-editor/assets/studio"
TARGET = ROOT / "skills/social-designer/assets/studio"
BRIEF = ROOT / "skills/social-content/assets/brief-template.md"
IGNORE = shutil.ignore_patterns(".DS_Store", "__pycache__", ".cache", "node_modules")


def sync():
    if TARGET.exists():
        shutil.rmtree(TARGET)
    shutil.copytree(SOURCE, TARGET, ignore=IGNORE)
    BRIEF.parent.mkdir(exist_ok=True)
    shutil.copyfile(SOURCE / "brief-template.md", BRIEF)
    print(f"Synced {sum(1 for p in TARGET.rglob('*') if p.is_file())} Studio files to social-designer and the brief to social-content.")


if __name__ == "__main__":
    sync()
