"""Strict source-timed SRT parsing and frame-based short-caption mapping.

No transcription, text rewriting, word alignment, or partial-cue trimming is
performed. All output intervals are half-open [start_frame, end_frame).
"""
from __future__ import annotations

from fractions import Fraction
import math
import re
import unicodedata


_STAMP = r"([0-9]{2,}):([0-9]{2}):([0-9]{2}),([0-9]{3})"
_TIMING = re.compile(rf"^{_STAMP} --> {_STAMP}$")
_MARKUP = re.compile(r"<[/!?]?[A-Za-z][^>]*>|\{\\|&(?:[A-Za-z][A-Za-z0-9]*|#[0-9]+|#x[0-9A-Fa-f]+);")


def _require(condition, message):
    if not condition:
        raise ValueError(message)


def _seconds(value, label):
    try:
        finite = type(value) in (int, float) and math.isfinite(value)
    except OverflowError:
        finite = False
    _require(finite,
             f"{label} must be a finite number, not a boolean")
    _require(value >= 0, f"{label} must be nonnegative")
    return Fraction(str(value))


def _integer(value, label, *, positive=False):
    _require(type(value) is int and value >= (1 if positive else 0),
             f"{label} must be a {'positive' if positive else 'nonnegative'} integer")
    return value


def _fps(value):
    _require(isinstance(value, Fraction) and value > 0,
             "fps must be a positive fractions.Fraction")
    return value


def _text(value, label):
    _require(isinstance(value, str) and value.strip(), f"{label} is empty")
    _require(not any(unicodedata.category(c) in {'Cc', 'Cf', 'Cs'}
                     for c in value if c != '\n'),
             f"{label} contains unsupported control characters")
    _require(not _MARKUP.search(value),
             f"{label} contains subtitle markup; supply explicitly reviewed plain text")
    return value


def _id(value, label):
    _require(isinstance(value, str) and value and '/' not in value and
             not any(c.isspace() or unicodedata.category(c).startswith('C') for c in value),
             f"{label} must be a nonempty identifier without spaces or slashes")
    return value


def _timestamp(groups, label):
    hours, minutes, seconds, milliseconds = map(int, groups)
    _require(minutes < 60 and seconds < 60, f"{label} has invalid minutes or seconds")
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds


def parse_srt(text):
    """Parse strict SRT into source-time cues, preserving the exact caption text.

    UTF-8 BOM and CRLF line endings are accepted. Styling tags, entity escapes,
    controls and ambiguous timing extensions fail instead of being stripped.
    """
    _require(isinstance(text, str), "SRT input must be text")
    text = text.removeprefix('\ufeff').replace('\r\n', '\n')
    _require('\r' not in text, "SRT contains an unsupported bare carriage return")
    text = text.strip('\n')
    _require(bool(text), "SRT is empty")
    cues, seen = [], set()
    previous_end = 0
    for number, block in enumerate(re.split(r'\n\n+', text), 1):
        lines = block.split('\n')
        _require(len(lines) >= 3, f"SRT block {number} needs an ID, timing and caption text")
        cue_id = lines[0]
        _require(bool(re.fullmatch(r'[0-9]+', cue_id)), f"SRT block {number} has an invalid numeric ID")
        _require(int(cue_id) not in seen, f"Duplicate SRT cue ID: {cue_id}")
        seen.add(int(cue_id))
        match = _TIMING.fullmatch(lines[1])
        _require(match is not None, f"SRT cue {cue_id} needs HH:MM:SS,mmm --> HH:MM:SS,mmm")
        start = _timestamp(match.groups()[:4], f"SRT cue {cue_id} start")
        end = _timestamp(match.groups()[4:], f"SRT cue {cue_id} end")
        _require(start < end, f"SRT cue {cue_id} has an empty or reversed range")
        _require(start >= previous_end, f"SRT cue {cue_id} overlaps or precedes the previous cue")
        value = _text('\n'.join(lines[2:]), f"SRT cue {cue_id} text")
        cues.append({'id': cue_id, 'start_seconds': start / 1000,
                     'end_seconds': end / 1000, 'text': value})
        previous_end = end
    return cues


def map_captions(cues, segments, fps):
    """Map complete source cues into selected, contiguous output segments.

    Source intervals use each segment's exact duration_frames/fps. A cue crossing
    a trim edge fails with its ID; splitting text requires reviewed new cue timing.
    All absolute output boundaries round to the nearest frame, with half-up ties.
    Shared source boundaries therefore stay shared without editing source times.
    Report each quantization delta; reject cues that collapse to zero frames.
    """
    fps = _fps(fps)
    _require(isinstance(cues, list), 'cues must be a list')
    _require(isinstance(segments, list) and segments, 'segments must be a nonempty list')
    validated, cue_ids = [], set()
    prior_end = Fraction(0)
    for cue in cues:
        _require(isinstance(cue, dict), 'Each cue must be an object')
        _require({'id', 'start_seconds', 'end_seconds', 'text'} <= set(cue), 'Cue is missing required fields')
        cue_id = _id(cue['id'], 'Cue ID')
        _require(cue_id not in cue_ids, f'Duplicate cue ID: {cue_id}')
        cue_ids.add(cue_id)
        start = _seconds(cue['start_seconds'], f'Cue {cue_id} start')
        end = _seconds(cue['end_seconds'], f'Cue {cue_id} end')
        _require(start < end, f'Cue {cue_id} has an empty or reversed range')
        _require(start >= prior_end, f'Cue {cue_id} overlaps or precedes the previous cue')
        _text(cue['text'], f'Cue {cue_id} text')
        validated.append((cue, start, end))
        prior_end = end

    mapped, segment_ids = [], set()
    output_cursor = 0
    for segment in segments:
        _require(isinstance(segment, dict), 'Each segment must be an object')
        _require({'id', 'source_in_seconds', 'duration_frames', 'start_frame'} <= set(segment),
                 'Segment is missing required fields')
        sid = _id(segment['id'], 'Segment ID')
        _require(sid not in segment_ids, f'Duplicate segment ID: {sid}')
        segment_ids.add(sid)
        source_in = _seconds(segment['source_in_seconds'], f'Segment {sid} source in')
        duration = _integer(segment['duration_frames'], f'Segment {sid} duration', positive=True)
        output_in = _integer(segment['start_frame'], f'Segment {sid} output start')
        _require(output_in == output_cursor, f'Segment {sid} output must begin at frame {output_cursor}')
        output_end = output_in + duration
        source_end = source_in + duration / fps
        for cue, start, end in validated:
            if end <= source_in or start >= source_end:
                continue
            _require(start >= source_in and end <= source_end,
                     f"Cue {cue['id']} crosses a trim boundary in segment {sid}; "
                     'extend the source range or supply reviewed split-cue text and timing')
            exact_first = Fraction(output_in) + (start - source_in) * fps
            exact_last = Fraction(output_in) + (end - source_in) * fps
            first = math.floor(exact_first + Fraction(1, 2))
            last = math.floor(exact_last + Fraction(1, 2))
            _require(first < last, f"Cue {cue['id']} collapses below one visible frame in segment {sid}; "
                     'use a higher output FPS or review the source cue timing')
            if mapped:
                _require(first >= mapped[-1]['end_frame'],
                         f"Cue {cue['id']} in segment {sid} overlaps {mapped[-1]['id']} after frame "
                         'quantization; review adjacent cue timing at the output FPS')
            mapped.append({'id': f"{sid}/{cue['id']}", 'source_cue_id': cue['id'], 'segment_id': sid,
                           'source_start_seconds': float(start), 'source_end_seconds': float(end),
                           'start_frame': first, 'end_frame': last,
                           'start_seconds': float(first / fps), 'end_seconds': float(last / fps),
                           'start_quantization_delta_seconds': float((first - exact_first) / fps),
                           'end_quantization_delta_seconds': float((last - exact_last) / fps),
                           'text': cue['text']})
        output_cursor = output_end
    return mapped


def _srt_time(milliseconds):
    hours, remainder = divmod(milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    seconds, millis = divmod(remainder, 1000)
    return f'{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}'


def write_srt(mapped, fps):
    """Write output-frame captions as SRT, rounding shared boundaries identically."""
    fps = _fps(fps)
    _require(isinstance(mapped, list), 'mapped captions must be a list')
    blocks, previous_end = [], 0
    for index, cue in enumerate(mapped, 1):
        _require(isinstance(cue, dict) and {'start_frame', 'end_frame', 'text'} <= set(cue),
                 f'Output cue {index} is missing required fields')
        first = _integer(cue['start_frame'], f'Output cue {index} start')
        last = _integer(cue['end_frame'], f'Output cue {index} end')
        _require(previous_end <= first < last, f'Output cue {index} overlaps or has an invalid range')
        value = _text(cue['text'], f'Output cue {index} text')
        # Round half upward rather than applying different start/end rounding,
        # so an adjoining frame boundary cannot become an SRT overlap.
        start_ms = math.floor(first / fps * 1000 + Fraction(1, 2))
        end_ms = math.floor(last / fps * 1000 + Fraction(1, 2))
        _require(start_ms < end_ms, f'Output cue {index} is shorter than SRT millisecond precision')
        blocks.append(f'{index}\n{_srt_time(start_ms)} --> {_srt_time(end_ms)}\n{value}')
        previous_end = last
    return '\n\n'.join(blocks) + ('\n' if blocks else '')
