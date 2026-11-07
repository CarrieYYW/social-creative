#!/usr/bin/env python3
"""Assemble selected speech passages and source-timed captions into a local short.

Python + Pillow; FFmpeg, FFprobe and fc-query (Fontconfig) on PATH. No transcription,
automatic story selection, speed changes, sound replacement or external service.
"""
from __future__ import annotations

import argparse
import copy
from fractions import Fraction
import hashlib
from importlib.metadata import version
import json
import math
import re
import unicodedata
from pathlib import Path
import shutil
import subprocess
import tempfile
import wave

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as error:
    raise SystemExit('Install Pillow in the Python environment running this renderer.') from error
from short_captions import parse_srt, map_captions, write_srt

SCRIPT = Path(__file__).resolve()
RATE = 48000
SOURCE_FORMATS = 'mov,matroska,webm,avi'
SDR_PIXEL_FORMATS = {
    'yuv420p', 'yuvj420p', 'yuv422p', 'yuvj422p', 'yuv444p', 'yuvj444p',
    'nv12', 'nv21', 'rgb24', 'bgr24', 'gbrp', 'rgba', 'bgra', 'argb',
    'abgr', 'gray', 'yuyv422', 'uyvy422', 'rgb0', 'bgr0', '0rgb', '0bgr',
}


def run(args):
    result = subprocess.run([str(a) for a in args], capture_output=True)
    require(result.returncode == 0, result.stderr.decode(errors='replace')[-4000:])
    return result.stdout


def require(condition, message):
    if not condition:
        raise ValueError(message)


def fields(value, required, optional=(), label='object'):
    require(isinstance(value, dict), f'{label} must be an object')
    require(set(required) <= set(value), f'{label} missing fields: {sorted(set(required) - set(value))}')
    require(set(value) <= set(required) | set(optional),
            f'{label} unsupported fields: {sorted(set(value) - set(required) - set(optional))}')


def finite(value):
    return type(value) in (int, float) and math.isfinite(value)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def ident(value):
    return isinstance(value, str) and bool(re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', value))


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f'Duplicate JSON key: {key}')
        result[key] = value
    return result


def rect(value, label):
    require(isinstance(value, list) and len(value) == 4 and all(finite(v) for v in value),
            f'{label} needs four finite numbers [x, y, width, height]')
    x, y, w, h = value
    require(x >= 0 and y >= 0 and w > 0 and h > 0 and
            x + w <= 1 + 1e-10 and y + h <= 1 + 1e-10, f'{label} is outside normalized frame')
    return list(value)


def font_coverage(font):
    # Inspect the same first font face that Pillow uses for the caption plate.
    intervals = run(['fc-query', '--index', '0', '--format', '%{charset}', '--', font]).decode().split()
    require(intervals, 'Caption font has no readable Unicode character map')
    ranges = []
    for interval in intervals:
        bounds = interval.split('-')
        ranges.append((int(bounds[0], 16), int(bounds[-1], 16)))
    return ranges


def check_text(text, coverage):
    for char in set(text) - {'\n'}:
        code = ord(char)
        category = unicodedata.category(char)
        simple_letter = unicodedata.name(char, '').startswith((
            'LATIN ', 'GREEK ', 'CYRILLIC ', 'CJK UNIFIED IDEOGRAPH',
            'CJK COMPATIBILITY IDEOGRAPH', 'HIRAGANA LETTER ', 'KATAKANA LETTER ',
            'BOPOMOFO LETTER ', 'HANGUL SYLLABLE ',
        ))
        supported = char.isascii() or simple_letter or category.startswith('P') or category == 'Zs'
        require(supported and not category.startswith(('C', 'M'))
                and unicodedata.bidirectional(char) not in ('R', 'AL', 'AN'),
                f'Caption character U+{code:04X} needs a shaping-aware editor')
        require(any(first <= code <= last for first, last in coverage),
                f'Caption font is missing Unicode glyph U+{code:04X}')


def probe(path, count=False):
    args = ['ffprobe', '-v', 'error'] + (['-count_frames'] if count else [])
    return json.loads(run(args + ['-protocol_whitelist', 'file', '-format_whitelist', SOURCE_FORMATS, '-show_streams', '-show_format', '-of', 'json', path]))


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def local(base, value, allow_external=False):
    require(nonempty(value) and '://' not in value and '\x00' not in value,
            'Inputs must be local file paths')
    path = (base / Path(value).expanduser()).resolve(strict=True)
    require(allow_external or path.is_relative_to(base),
            'Input must stay inside the job folder (only --reference-source allows external footage)')
    require(path.is_file() and path.stat().st_size > 0, f'Missing or empty input: {path}')
    return path


def seconds(value):
    return f'{float(value):.12f}'


def caption_plate(text, cfg, font_path, canvas):
    """Preserve explicit lines and fixed size. Never shrink or rewrite speech."""
    w, h = canvas
    x, y, bw, bh = [round(v * s) for v, s in zip(cfg['box'], (w, h, w, h))]
    face = ImageFont.truetype(str(font_path), cfg['size_px'])
    lines = text.split('\n')
    bounds = [face.getbbox(line) for line in lines]
    advance = round(cfg['size_px'] * 1.2)
    ink_height = max(i * advance + b[3] - b[1] for i, b in enumerate(bounds))
    pad = max(2, round(cfg['size_px'] * .22))
    require(ink_height + 2 * pad <= bh and all(b[2] - b[0] + 2 * pad <= bw for b in bounds),
            f'Caption does not fit at {cfg["size_px"]}px: {text!r}. Rebreak the lines or enlarge the box.')
    image = Image.new('RGBA', canvas)
    draw = ImageDraw.Draw(image)
    draw.rectangle((x, y, x + bw - 1, y + ink_height + 2 * pad - 1), fill=(0, 0, 0, 205))
    for i, (line, b) in enumerate(zip(lines, bounds)):
        draw.text((x + (bw - b[2] + b[0]) / 2 - b[0], y + pad + i * advance - b[1]),
                  line, font=face, fill='white')
    return image


def load_project(path, reference_source=False):
    for program in ('ffprobe', 'fc-query'):
        require(shutil.which(program), f'Input verification requires {program} on PATH')
    path = Path(path).resolve(strict=True)
    cfg = json.loads(path.read_text(), object_pairs_hook=unique_object)
    fields(cfg, ('schema_version', 'title', 'source', 'canvas', 'fps', 'segments', 'captions'))
    require(cfg['schema_version'] == 'speech-short-1.0', 'Expected speech-short-1.0 project')
    require(nonempty(cfg['title']), 'Title must be nonempty')
    fields(cfg['source'], ('path', 'provenance', 'audio_track'))
    require(nonempty(cfg['source']['provenance']), 'Record the supplied source provenance')
    fields(cfg['canvas'], ('width', 'height'))
    canvas = tuple(cfg['canvas'][k] for k in ('width', 'height'))
    require(all(type(n) is int and 64 <= n <= 4096 and n % 2 == 0 for n in canvas),
            'Canvas requires even integer dimensions from 64 to 4096')
    fields(cfg['fps'], ('num', 'den'))
    require(all(type(n) is int and n > 0 for n in cfg['fps'].values()), 'Invalid rational FPS')
    fps = Fraction(cfg['fps']['num'], cfg['fps']['den'])
    require(1 <= fps <= 120, 'FPS must be from 1 to 120')
    source = local(path.parent, cfg['source']['path'], allow_external=reference_source)
    meta = probe(source)
    videos = [s for s in meta['streams'] if s['codec_type'] == 'video' and not s.get('disposition', {}).get('attached_pic')]
    audios = [s for s in meta['streams'] if s['codec_type'] == 'audio']
    track = cfg['source']['audio_track']
    require(len(videos) == 1, 'Requires exactly one real video stream')
    require(type(track) is int and 0 <= track < len(audios), 'Selected source audio track is missing')
    video, audio = videos[0], audios[track]
    require(audio.get('channels') in (1, 2), 'Select a mono/stereo dialogue track; surround mixing needs an editor')
    for stream in (video, audio):
        require('start_time' in stream and abs(float(stream['start_time'])) <= 1 / RATE,
                'Nonzero/unknown source A/V start offset: normalize in an editor without losing sync first')
        require('duration' in stream and float(stream['duration']) > 0, 'Source stream duration is unknown')
    require(video.get('sample_aspect_ratio', '1:1') in ('1:1', '0:1', 'N/A'), 'Normalize non-square source pixels first')
    rotations = [s.get('rotation', 0) for s in video.get('side_data_list', [])]
    rotations += [video.get('tags', {}).get('rotate', 0)]
    require(all(float(r) % 360 == 0 for r in rotations), 'Normalize source rotation first')
    require(video.get('color_transfer') not in ('smpte2084', 'arib-std-b67'), 'HDR source needs deliberate SDR conversion first')
    require(video.get('pix_fmt') in SDR_PIXEL_FORMATS,
            'Unsupported pixel format; normalize high-bit-depth or unusual media to 8-bit SDR first')
    require(isinstance(cfg['segments'], list) and cfg['segments'], 'Select at least one passage')
    total = 0
    ids = set()
    segments = []
    duration = min(Fraction(video['duration']), Fraction(audio['duration']))
    for raw in cfg['segments']:
        fields(raw, ('id', 'source_in_seconds', 'duration_frames', 'crop'))
        sid, start, count = raw['id'], raw['source_in_seconds'], raw['duration_frames']
        require(ident(sid) and sid not in ids, 'Segment IDs must be unique kebab-case names')
        ids.add(sid)
        require(finite(start) and start >= 0, f'{sid}: invalid source in point')
        require(type(count) is int and count > 0, f'{sid}: duration_frames must be a positive integer')
        end = Fraction(str(start)) + count / fps
        require(end <= duration, f'{sid}: selected passage exceeds video or audio duration')
        crop = rect(raw['crop'], f'{sid} crop')
        sw, sh = video['width'], video['height']
        # Integer source crop is explicit; center-cover within it preserves aspect.
        pixel_crop = [round(crop[0] * sw), round(crop[1] * sh), round(crop[2] * sw), round(crop[3] * sh)]
        require(pixel_crop[2] >= 2 and pixel_crop[3] >= 2 and pixel_crop[0] + pixel_crop[2] <= sw and
                pixel_crop[1] + pixel_crop[3] <= sh, f'{sid}: rounded crop is invalid')
        segments.append({**raw, 'start_frame': total, 'end_frame': total + count,
                         'source_out_seconds': float(end), 'pixel_crop': pixel_crop})
        total += count
    captions = cfg['captions']
    fields(captions, ('path', 'font_path', 'font_license_path', 'box', 'size_px'))
    rect(captions['box'], 'Caption box')
    require(type(captions['size_px']) is int and 8 <= captions['size_px'] <= 512, 'Invalid caption size')
    srt = local(path.parent, captions['path'])
    font = local(path.parent, captions['font_path'])
    license_file = local(path.parent, captions['font_license_path'])
    cues = parse_srt(srt.read_text(encoding='utf-8-sig'))
    mapped = map_captions(cues, segments, fps)
    require(mapped, 'No supplied caption cues fall within the selected passages')
    coverage = font_coverage(font)
    for cue in mapped:
        check_text(cue['text'], coverage)
        caption_plate(cue['text'], captions, font, canvas)
    return {'path': path, 'cfg': cfg, 'source': source, 'font': font, 'license': license_file,
            'srt': srt, 'fps': fps, 'canvas': canvas, 'segments': segments, 'frames': total,
            'cues': mapped, 'source_cues': cues, 'video_stream': video['index'], 'audio_stream': audio['index'],
            'source_metadata': meta}


def extract_audio(job, target):
    """Map global output sample boundaries once; retain original speech at 1x."""
    with wave.open(str(target), 'wb') as wav:
        wav.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
        for seg in job['segments']:
            first = round(Fraction(str(seg['source_in_seconds'])) * RATE)
            a = round(seg['start_frame'] / job['fps'] * RATE)
            b = round(seg['end_frame'] / job['fps'] * RATE)
            samples = b - a
            # Source timestamps, not a count from the first decoded sample: a
            # recording can contain timestamp gaps even when start_time is zero.
            audio = run(['ffmpeg', '-v', 'error', '-nostdin', '-protocol_whitelist', 'file', '-format_whitelist', SOURCE_FORMATS, '-i', job['source'], '-map', f'0:{job["audio_stream"]}',
                         '-af', f'aresample={RATE},atrim=start={seconds(Fraction(first, RATE))}:end={seconds(Fraction(first + samples, RATE))},asetpts=PTS-STARTPTS',
                         '-ac', 2, '-f', 's16le', 'pipe:1'])
            require(len(audio) == samples * 4, f'{seg["id"]}: source audio is incomplete; no silence was added')
            wav.writeframesraw(audio)


def video_command(job, seg):
    x, y, w, h = seg['pixel_crop']
    width, height = job['canvas']
    filters = [f'trim=start={seconds(seg["source_in_seconds"])}:end={seconds(seg["source_out_seconds"])}',
               f'setpts=PTS-{seconds(seg["source_in_seconds"])}/TB', f'fps={job["fps"]}:round=near:start_time=0',
               f'crop={w}:{h}:{x}:{y}:exact=1',
               f'scale={width}:{height}:force_original_aspect_ratio=increase:flags=lanczos',
               f'crop={width}:{height}', 'setsar=1', 'format=rgb24']
    return [str(arg) for arg in ['ffmpeg', '-v', 'error', '-nostdin', '-noautorotate', '-protocol_whitelist', 'file', '-format_whitelist', SOURCE_FORMATS, '-i', job['source'],
            '-map', f'0:{job["video_stream"]}', '-an', '-vf', ','.join(filters),
            '-frames:v', seg['duration_frames'], '-threads', '1', '-f', 'rawvideo', 'pipe:1']]


def render_project(project_path, output, reference_source=False):
    require(shutil.which('ffmpeg'), 'Rendering requires ffmpeg on PATH')
    job = load_project(project_path, reference_source)
    output = Path(output).absolute()
    require(not output.exists() and not output.is_symlink(), f'Output must be a new directory: {output}')
    require(output.parent.is_dir(), 'Output parent must exist')
    # Prevent private source bundles from becoming part of a packaged skill.
    if SCRIPT.parent.name == 'scripts' and (SCRIPT.parent.parent / 'SKILL.md').is_file():
        skill_root = SCRIPT.parent.parent
        protected = skill_root.parent.parent if (skill_root.parent.parent / 'plugin.json').is_file() else skill_root
        require(not output.resolve().is_relative_to(protected),
                'Write private exports to the project folder outside the plugin/skill')
    duration = job['frames'] / job['fps']
    # A conservative preflight, not a promise about encoder size.
    budget = (0 if reference_source else job['source'].stat().st_size) + float(duration) * (RATE * 4 + 3000000) + 16_000_000
    require(shutil.disk_usage(output.parent).free > budget, 'Insufficient disk for this source bundle/export; free space or use --reference-source')
    input_roles = ('path', 'source', 'font', 'license', 'srt')
    hashes = {role: sha(job[role]) for role in input_roles}
    output.mkdir()
    (output / 'render-state.json').write_text(json.dumps({'status': 'rendering', 'review': 'unverified'}))
    wav = output / 'speech.wav'
    try:
        extract_audio(job, wav)
        width, height = job['canvas']
        temp = output / 'video.rendering.mp4'
        cmd = ['ffmpeg', '-v', 'error', '-nostdin', '-n', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
               '-s', f'{width}x{height}', '-r', str(job['fps']), '-i', 'pipe:0', '-i', str(wav),
               '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
               '-threads', '2', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', str(RATE),
               '-movflags', '+faststart', str(temp)]
        keyframes = {0, job['frames'] - 1}
        keyframes.update(s['start_frame'] for s in job['segments'])
        keyframes.update((c['start_frame'] + c['end_frame'] - 1) // 2 for c in job['cues'])
        cue_index, active_text, plate = 0, None, None
        with tempfile.TemporaryFile() as errors:
            encoder = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=errors)
            try:
                for seg in job['segments']:
                    with tempfile.TemporaryFile() as dec_errors:
                        decoder = subprocess.Popen(video_command(job, seg), stdout=subprocess.PIPE, stderr=dec_errors)
                        try:
                            for offset in range(seg['duration_frames']):
                                raw = decoder.stdout.read(width * height * 3)
                                require(len(raw) == width * height * 3, f'{seg["id"]}: decoded video ended early; adjust trim')
                                frame = seg['start_frame'] + offset
                                picture = Image.frombytes('RGB', (width, height), raw)
                                while cue_index < len(job['cues']) and job['cues'][cue_index]['end_frame'] <= frame:
                                    cue_index += 1
                                cue = job['cues'][cue_index] if cue_index < len(job['cues']) else None
                                if cue and cue['start_frame'] <= frame < cue['end_frame']:
                                    if cue['text'] != active_text:
                                        plate = caption_plate(cue['text'], job['cfg']['captions'], job['font'], job['canvas'])
                                        active_text = cue['text']
                                    picture.paste(plate, (0, 0), plate)
                                encoder.stdin.write(picture.tobytes())
                                if frame in keyframes:
                                    picture.save(output / f'frame-{frame:06}.jpg', quality=92)
                            decoder.stdout.close()
                            status = decoder.wait()
                            dec_errors.seek(0)
                            require(status == 0, dec_errors.read().decode(errors='replace')[-3000:])
                        finally:
                            if decoder.stdout and not decoder.stdout.closed:
                                decoder.stdout.close()
                            if decoder.poll() is None:
                                decoder.terminate()
                                decoder.wait()
                encoder.stdin.close()
                status = encoder.wait()
                errors.seek(0)
                require(status == 0, errors.read().decode(errors='replace')[-3000:])
            finally:
                if encoder.stdin and not encoder.stdin.closed:
                    encoder.stdin.close()
                if encoder.poll() is None:
                    encoder.terminate()
                    encoder.wait()
        info = probe(temp, count=True)
        v = next(s for s in info['streams'] if s['codec_type'] == 'video')
        a = next(s for s in info['streams'] if s['codec_type'] == 'audio')
        require(int(v['nb_read_frames']) == job['frames'] and Fraction(v['avg_frame_rate']) == job['fps'], 'Encoded frame count/FPS mismatch')
        require((v['width'], v['height']) == job['canvas'] and v['pix_fmt'] == 'yuv420p', 'Encoded canvas/pixel format mismatch')
        require(a['sample_rate'] == str(RATE) and a['channels'] == 2, 'Encoded audio format mismatch')
        require(abs(float(a['duration']) - float(duration)) <= .025, 'Encoded audio duration mismatch')
        run(['ffmpeg', '-v', 'error', '-xerror', '-i', temp, '-f', 'null', '-'])
        for role, digest in hashes.items():
            require(sha(job[role]) == digest, f'Input changed during rendering: {role}')
        data = copy.deepcopy(job['cfg'])
        inputs = output / 'inputs'
        inputs.mkdir()
        if reference_source:
            data['source']['path'] = str(job['source'])
        else:
            source_copy = inputs / ('source-media' + job['source'].suffix)
            shutil.copy2(job['source'], source_copy)
            require(sha(source_copy) == hashes['source'], 'Copied source hash mismatch')
            data['source']['path'] = str(source_copy.relative_to(output))
        for key, role, name in [('path', 'srt', 'source.srt'),
                                ('font_path', 'font', 'caption-font' + job['font'].suffix),
                                ('font_license_path', 'license', 'font-license.txt')]:
            original = job[role]
            shutil.copy2(original, inputs / name)
            require(sha(inputs / name) == hashes[role], 'Copied caption/font input changed')
            data['captions'][key] = 'inputs/' + name
        (output / 'project.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        (output / 'captions.srt').write_text(write_srt(job['cues'], job['fps']))
        for filename in ('render_speech_short.py', 'short_captions.py'):
            shutil.copy2(SCRIPT.with_name(filename), output / filename)
        packages = {name: version(name) for name in ('Pillow',)}
        (output / 'requirements.txt').write_text(''.join(f'{name}=={ver}\n' for name, ver in packages.items()))
        temp.rename(output / 'video.mp4')
        report = {'status': 'rendered_review_unverified', 'title': data['title'], 'frames': job['frames'],
                  'fps': data['fps'], 'duration_seconds': float(duration), 'segments': job['segments'],
                  'captions': job['cues'], 'source_sha256': hashes, 'output_sha256': sha(output / 'video.mp4'),
                  'source_bundle': 'referenced_nonportable' if reference_source else 'copied_portable',
                  'runtime': {'packages': packages, 'ffmpeg': run(['ffmpeg', '-version']).decode().splitlines()[0]},
                  'excluded_source_cue_ids': [c['id'] for c in job['source_cues'] if not any(m['source_cue_id'] == c['id'] for m in job['cues'])],
                  'verification': {'decode': 'passed', 'frame_count': int(v['nb_read_frames']), 'audio_duration_seconds': float(a['duration'])},
                  'review': {'story_context': 'unverified', 'transcript_accuracy': 'unverified', 'continuous_playback': 'unverified',
                             'listening': 'unverified', 'crop_and_caption_placement': 'unverified'},
                  'limits': ['Hard cuts, original selected audio at 1x, static phrase captions; no word alignment or transcription.',
                             'Source cuts are not judged for meaning; supplied caption completeness is not proof of dialogue coverage.',
                             'Source picture is converted to CFR against source timestamps; inspect variable-rate footage and sampled cut boundaries.',
                             'Audio sample boundaries are rounded from absolute output frames at 48kHz; no normalization or fades.',
                             'No managed color conversion, rotation correction or subject tracking; review SDR color and framing.']}
        (output / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        (output / 'render-state.json').write_text(json.dumps({'status': report['status']}))
        wav.unlink()
        return report
    except BaseException as error:
        (output / 'render-state.json').write_text(json.dumps({'status': 'failed', 'error': str(error)}))
        raise


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--project', required=True, type=Path)
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--out', type=Path)
    ap.add_argument('--reference-source', action='store_true', help='Keep an absolute source reference instead of copying the recording; bundle is not portable')
    args = ap.parse_args()
    try:
        if args.check:
            job = load_project(args.project, args.reference_source)
            print(json.dumps({'status': 'inputs_valid_review_unverified', 'frames': job['frames'], 'segments': job['segments'], 'captions': job['cues']}, indent=2))
        else:
            report = render_project(args.project, args.out, args.reference_source)
            print(json.dumps({'status': report['status'], 'video': str(args.out / 'video.mp4'), 'frames': report['frames']}))
    except (ValueError, KeyError, OSError, TypeError) as error:
        ap.exit(1, f'ERROR: {error}\n')


if __name__ == '__main__':
    main()
