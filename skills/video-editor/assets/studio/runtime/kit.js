// Pure helpers shared by templates. No DOM, so they can be unit-tested in Node.
export const VIDEO_EXT = /\.(mp4|mov|webm|m4v|mkv)$/i;
export const isVideo = (src) => VIDEO_EXT.test(String(src || ''));
export const sans = (brand) => ({ family: brand.text, fallback: 'Helvetica, Arial, sans-serif' });
export const serif = (brand) => ({ family: brand.display, fallback: 'Georgia, serif' });

export const finishControls = (grain = 0.08) => [
  { id: 'grain', group: 'Finish', type: 'number', label: 'Grain', default: grain, min: 0, max: 0.4, step: 0.01 },
  { id: 'vignette', group: 'Finish', type: 'number', label: 'Vignette', default: 0, min: 0, max: 0.6, step: 0.01 },
];

// Keep-ranges of a source -> edited timeline. Word timings follow the cut, never the source clock.
export function timelineFromEdits(edits) {
  let at = 0;
  return edits.map((e) => {
    const seg = { in: e.in, out: e.out, duration: e.out - e.in, at };
    at += seg.duration;
    return seg;
  });
}

export function remapWords(words, edits) {
  const segs = timelineFromEdits(edits);
  const out = [];
  for (const seg of segs) {
    for (const w of words) {
      const mid = (w.s + w.e) / 2;
      if (mid < seg.in || mid >= seg.out) continue;
      out.push({ ...w, s: Math.max(seg.at, seg.at + w.s - seg.in), e: Math.min(seg.at + seg.duration, seg.at + w.e - seg.in) });
    }
  }
  return out;
}

// Shot length follows a montage's emotional job. Values are beats of music.
export const SHOT_BEATS = { open: 4, establish: 4, people: 2, detail: 1, peak: 1, breath: 8, title: 8, close: 8 };

export function montagePlan(clips, bpm) {
  const beat = 60 / bpm;
  return clips.map((c) => {
    let beats = c.beats ?? SHOT_BEATS[c.role] ?? 2;
    // A shot carrying words must stay long enough to read, in whole beats so cuts stay on the music.
    if (c.text && c.beats === undefined) {
      const words = (String(c.text).match(/\S+/g) || []).length;
      beats = Math.max(beats, Math.ceil((0.75 + Math.max(5 / 6, words / 3)) / beat));
    }
    return { ...c, beats, seconds: beats * beat };
  });
}
