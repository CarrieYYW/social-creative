#!/usr/bin/env python3
"""Check standalone plugin manifests, catalogs, metadata, and local links."""

import json
import re
from pathlib import Path


def check(root):
    manifests = [
        json.loads((root / path).read_text())
        for path in ["plugin.json", ".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]
    ]
    identity = {(item["name"], item["version"]) for item in manifests}
    assert len(identity) == 1, "Plugin manifest names/versions differ"
    name, version = next(iter(identity))
    assert name == "social-creative"
    assert re.fullmatch(r"\d+\.\d+\.\d+", version)
    for path in [".claude-plugin/marketplace.json", ".agents/plugins/marketplace.json"]:
        catalog = json.loads((root / path).read_text())
        assert catalog["name"] == "social-creative", path
        assert len(catalog["plugins"]) == 1, path
        entry = catalog["plugins"][0]
        assert entry["name"] == name, path
        source = entry["source"]
        if isinstance(source, dict):
            assert source == {"source": "local", "path": "./"}, path
            assert entry["policy"]["installation"] == "AVAILABLE", path
        else:
            assert source == "./", path

    skills = sorted(path.parent for path in (root / "skills").glob("*/SKILL.md"))
    assert skills, "No skills found"
    for skill in skills:
        instructions = (skill / "SKILL.md").read_text()
        assert instructions.startswith("---\n"), skill
        frontmatter = instructions.split("---\n", 2)[1]
        match = re.search(r"^name:\s*([^\n]+)$", frontmatter, re.MULTILINE)
        assert match and match[1].strip("\"'") == skill.name, skill
        assert re.search(r"^description:\s*\S", frontmatter, re.MULTILINE), skill
        assert "[TODO:" not in instructions, skill
        metadata = (skill / "agents/openai.yaml").read_text()
        assert f"${skill.name}" in metadata, skill
    # Inline OpenAI settings replace the compatibility overlay, rather than merge.
    inline = manifests[0].get("extensions", {}).get("com.openai")
    settings = inline if isinstance(inline, dict) else manifests[2].get("extensions", {}).get("com.openai", {})
    onboarding = settings.get("onboardingSkill")
    assert isinstance(onboarding, str) and onboarding.startswith("./"), "Missing onboarding skill"
    target = (root / onboarding).resolve()
    assert target.is_relative_to(root.resolve()), "Onboarding path escapes plugin"
    assert target in [(skill / "SKILL.md").resolve() for skill in skills], "Onboarding target is not a packaged skill"
    links = 0
    for path in [root / "README.md", root / "AGENTS.md", *(root / "skills").rglob("*.md")]:
        for target in re.findall(r"\]\(([^)]+)\)", path.read_text()):
            if "://" in target or target.startswith(("#", "mailto:")):
                continue
            destination = (path.parent / target.split("#", 1)[0]).resolve()
            assert destination.is_relative_to(root.resolve()), f"External local link: {path}: {target}"
            assert destination.exists(), f"Missing local link: {path}: {target}"
            links += 1
    print(f"Plugin {version}: {len(skills)} skills, both catalogs, manifests, metadata, and {links} local links pass.")
    return skills


if __name__ == "__main__":
    check(Path(__file__).resolve().parents[1])
