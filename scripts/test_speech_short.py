"""Exercise the optional speech-cut renderer with a local color/tone recording."""
import array
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
RENDERER = ROOT / 'skills/video-editor/scripts/render_speech_short.py'
FONTS = ROOT / 'skills/social-designer/assets/quote-studio/fonts'


class SpeechCut(unittest.TestCase):
    def test_order_audio_captions_and_portable_rerender(self):
        with tempfile.TemporaryDirectory() as tmp:
            job = Path(tmp)
            shutil.copy(FONTS / 'sans.ttf', job / 'font.ttf')
            shutil.copy(FONTS / 'sans-OFL.txt', job / 'font-license.txt')
            self.run_ok(
                'ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=red:s=160x120:r=10:d=1',
                '-f', 'lavfi', '-i', 'color=blue:s=160x120:r=10:d=1', '-f', 'lavfi', '-i',
                'sine=frequency=440:duration=1:sample_rate=48000', '-f', 'lavfi', '-i',
                'sine=frequency=880:duration=1:sample_rate=48000', '-filter_complex',
                '[0:v][2:a][1:v][3:a]concat=n=2:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'pcm_s16le', job / 'source.mov')
            (job / 'source.srt').write_text(
                '1\n00:00:00,200 --> 00:00:00,800\nRed\n\n'
                '2\n00:00:01,200 --> 00:00:01,800\nBlue\n')
            project = job / 'project.json'
            data = {
                'schema_version': 'speech-short-1.0', 'title': 'Color and tone timing test',
                'source': {'path': 'source.mov', 'provenance': 'Generated here', 'audio_track': 0},
                'canvas': {'width': 160, 'height': 120}, 'fps': {'num': 10, 'den': 1},
                'segments': [{'id': label, 'source_in_seconds': start, 'duration_frames': 10,
                              'crop': [0, 0, 1, 1]} for label, start in [('blue', 1), ('red', 0)]],
                'captions': {'path': 'source.srt', 'font_path': 'font.ttf',
                             'font_license_path': 'font-license.txt', 'size_px': 14,
                             'box': [.05, .6, .9, .3]},
            }
            project.write_text(json.dumps(data))
            cut = job / 'cut'
            self.run_ok(sys.executable, RENDERER, '--project', project, '--out', cut)
            self.assertEqual((cut / 'captions.srt').read_text(),
                             '1\n00:00:00,200 --> 00:00:00,800\nBlue\n\n'
                             '2\n00:00:01,200 --> 00:00:01,800\nRed\n')
            report = json.loads((cut / 'manifest.json').read_text())
            self.assertEqual(report['verification']['frame_count'], 20)
            self.assertEqual(report['review']['listening'], 'unverified')
            pixels = self.run_ok('ffmpeg', '-v', 'error', '-i', cut / 'video.mp4',
                                 '-map', '0:v:0', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-')
            # Top-left pixel of frames immediately before/after the join.
            offset = 160 * 120 * 3
            self.assertGreater(pixels[9 * offset + 2], 180)
            self.assertGreater(pixels[10 * offset], 180)
            pcm = self.run_ok('ffmpeg', '-v', 'error', '-i', cut / 'video.mp4', '-map', '0:a:0',
                              '-ac', '1', '-ar', '48000', '-f', 's16le', '-')
            samples = array.array('h', pcm)
            if sys.byteorder != 'little':
                samples.byteswap()
            for start, frequency in [(0, 880), (1, 440)]:
                segment = samples[start * 48000 + 12000:start * 48000 + 36000]
                crossings = sum(a < 0 <= b for a, b in zip(segment, segment[1:]))
                self.assertAlmostEqual(crossings / .5, frequency, delta=3)
            self.run_ok(sys.executable, cut / 'render_speech_short.py', '--project',
                        cut / 'project.json', '--out', job / 'second')
            data['segments'][0]['source_in_seconds'] = 1.4
            data['segments'][0]['duration_frames'] = 6
            project.write_text(json.dumps(data))
            bad = subprocess.run([sys.executable, RENDERER, '--project', project, '--check'],
                                 capture_output=True, text=True)
            self.assertNotEqual(bad.returncode, 0)
            self.assertIn('crosses a trim boundary', bad.stderr)

    def run_ok(self, *args):
        result = subprocess.run(args, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr.decode(errors='replace'))
        return result.stdout


if __name__ == '__main__':
    unittest.main()
