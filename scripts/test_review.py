#!/usr/bin/env python3
"""Regression checks for review packet identity, safe embedding, and file preservation."""

import contextlib
import hashlib
import io
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.dont_write_bytecode = True
from pack_skills import pack
root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("make_review", root / "skills/video-editor/scripts/make_review.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReviewPacketTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.folder = Path(self.temporary.name)
        self.source = self.folder / "draft.mp4"
        # Container-header fixture only; real browser playback is a separate check.
        self.media = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 100
        self.source.write_bytes(self.media)
        self.output = self.folder / "v01"

    def test_packet_binds_feedback_to_copied_media(self):
        page = module.make_review(self.source, self.output, "v01")
        context = json.loads((self.output / "review-context.json").read_text())
        self.assertEqual(context['media_sha256'], hashlib.sha256(self.media).hexdigest())
        self.assertEqual(context['version'], 'v01')
        self.assertEqual(context['time_basis'], 'elapsed_seconds_in_this_review_mp4')
        self.assertEqual((self.output / "review.mp4").read_bytes(), self.media)
        self.assertEqual(self.source.read_bytes(), self.media)
        self.assertNotIn('__REVIEW_CONTEXT__', page.read_text())

    def test_standalone_package_excludes_generated_bytecode(self):
        skill = self.folder / 'skills' / 'sample'
        skill.mkdir(parents=True)
        (skill / 'SKILL.md').write_text('Sample skill')
        (skill / 'helper.py').write_text('print("hello")')
        (skill / '__pycache__').mkdir()
        (skill / '__pycache__' / 'helper.cpython-39.pyc').write_bytes(b'cache')
        (skill / 'old.pyc').write_bytes(b'cache')
        with patch('pack_skills.check', return_value=[skill]), contextlib.redirect_stdout(io.StringIO()):
            pack(self.folder)
        import zipfile
        with zipfile.ZipFile(self.folder / 'dist/sample.zip') as archive:
            self.assertEqual(set(archive.namelist()), {'sample/SKILL.md', 'sample/helper.py'})

    def test_existing_packet_is_preserved(self):
        self.output.mkdir()
        sentinel = self.output / 'keep.txt'
        sentinel.write_text('existing review')
        with self.assertRaises(FileExistsError):
            module.make_review(self.source, self.output, 'v02')
        self.assertEqual(sentinel.read_text(), 'existing review')

    def test_bad_input_does_not_create_output(self):
        self.source.write_bytes(b'not an MP4')
        with self.assertRaises(ValueError):
            module.make_review(self.source, self.output, 'v01')
        self.assertFalse(self.output.exists())
        self.source.write_bytes(self.media)
        with self.assertRaises(ValueError):
            module.make_review(self.source, self.output, '  ')
        self.assertFalse(self.output.exists())

    def test_markup_cannot_close_context_script(self):
        version = '</script><script>alert("bad")</script> & quote'
        page = module.make_review(self.source, self.output, version)
        html = page.read_text()
        embedded = html.split('const context = ', 1)[1].split(';\n', 1)[0]
        self.assertNotIn('<', embedded)
        self.assertEqual(json.loads(embedded)['version'], version)

    def test_failed_packet_move_preserves_source_and_cleans_partial_output(self):
        with patch.object(module.shutil, 'move', side_effect=OSError('simulated move failure')):
            with self.assertRaises(OSError):
                module.make_review(self.source, self.output, 'v01')
        self.assertEqual(self.source.read_bytes(), self.media)
        self.assertFalse(self.output.exists())
        self.assertEqual(list(self.folder.glob('.review-build-*')), [])


if __name__ == '__main__':
    unittest.main()
