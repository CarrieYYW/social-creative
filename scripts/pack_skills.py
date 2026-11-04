#!/usr/bin/env python3
"""Package each self-contained skill without clearing unrelated output files."""

import posixpath
import re
import zipfile
from pathlib import Path

from check_plugin import check


def pack(root):
    skills = check(root)
    output = root / "dist"
    output.mkdir(exist_ok=True)
    for skill in skills:
        contents = {
            f"{skill.name}/{path.relative_to(skill).as_posix()}": path.read_bytes()
            for path in skill.rglob("*")
            if path.is_file()
            and path.name != ".DS_Store"
            and "__pycache__" not in path.relative_to(skill).parts
            and path.suffix not in {".pyc", ".pyo"}
        }
        archive = output / f"{skill.name}.zip"
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
            for path, data in contents.items():
                bundle.writestr(path, data)
        with zipfile.ZipFile(archive) as bundle:
            assert bundle.testzip() is None, archive
            assert set(bundle.namelist()) == set(contents), archive
            for path, data in contents.items():
                assert bundle.read(path) == data, path
                if path.endswith(".md"):
                    for target in re.findall(r"\]\(([^)]+)\)", data.decode()):
                        if "://" in target or target.startswith(("#", "mailto:")):
                            continue
                        destination = posixpath.normpath(posixpath.join(posixpath.dirname(path), target.split("#", 1)[0]))
                        assert destination in contents, f"Missing standalone reference: {path}: {target}"
        print(f"{archive.name}: {len(contents)} files, source parity and standalone links pass.")


if __name__ == "__main__":
    pack(Path(__file__).resolve().parents[1])
