#!/usr/bin/env python3
"""Package an existing MP4 with an offline, version-bound feedback player."""

import argparse
import hashlib
import json
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path


def make_review(source, output, version):
    source, output = Path(source).resolve(), Path(output).resolve()
    if not version.strip():
        raise ValueError("Version must not be empty")
    if not source.is_file() or source.suffix.lower() != ".mp4":
        raise ValueError("Source must be an existing browser-playable MP4")
    with source.open("rb") as media:
        header = media.read(64)
    if b"ftyp" not in header:
        raise ValueError("Source does not have an MP4 file-type header")
    if output.exists():
        raise FileExistsError("Output already exists; use a new version folder")
    if not output.parent.is_dir():
        raise ValueError("Output parent must already exist")
    template = (Path(__file__).resolve().parents[1] / "assets/review.html").read_text()
    # Stage files first; handled publication failures remove the new packet.
    with tempfile.TemporaryDirectory(prefix=".review-build-", dir=output.parent) as staging:
        packet = Path(staging) / "packet"
        packet.mkdir()
        shutil.copyfile(source, packet / "review.mp4")
        digest = hashlib.sha256()
        with (packet / "review.mp4").open("rb") as media:
            for block in iter(lambda: media.read(1024 * 1024), b""):
                digest.update(block)
        context = {
            "schema": "social-creative-review/v1",
            "version": version.strip(),
            "media_name": source.name,
            "media_sha256": digest.hexdigest(),
            "time_basis": "elapsed_seconds_in_this_review_mp4",
            "created_utc": datetime.now(timezone.utc).isoformat(),
        }
        # Escape script-closing markup even when filenames/labels contain HTML.
        embedded = json.dumps(context, ensure_ascii=True).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
        (packet / "index.html").write_text(template.replace("__REVIEW_CONTEXT__", embedded))
        (packet / "review-context.json").write_text(json.dumps(context, indent=2) + "\n")
        # mkdir is exclusive; never overwrite an existing packet, even in a race.
        output.mkdir()
        try:
            for item in packet.iterdir():
                shutil.move(str(item), output / item.name)
        except BaseException:
            shutil.rmtree(output)
            raise
    return output / "index.html"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Already-rendered browser-playable MP4")
    parser.add_argument("--output", required=True, type=Path, help="New packet folder (parent must exist)")
    parser.add_argument("--version", required=True, help="Draft label, e.g. v01")
    args = parser.parse_args()
    try:
        result = make_review(args.source, args.output, args.version)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Review packet failed: {error}\n")
    print(f"Open {result}\nKeep the packet files together. Download feedback before closing the page.")


if __name__ == "__main__":
    main()
