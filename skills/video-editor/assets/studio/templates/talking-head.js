// Talking head: keep-range edit, punch-ins, hook title, phrase captions, lower third, B-roll.
import { finishControls, isVideo, remapWords, sans, timelineFromEdits } from '../runtime/kit.js';

import { RECORDS } from '../runtime/records.js';

export const meta = {
  id: 'talking-head', name: 'Talking head', status: 'experimental',
  formats: ['reel', 'story', 'landscape', 'square'],
  summary: 'Speaker footage with cuts, punch-ins, captions and B-roll.',
};

export const controls = [
  { id: 'clip', group: 'Footage', type: 'asset', label: 'Speaker clip', default: '', accept: 'video' },
  { id: 'edits', record: RECORDS.edits, group: 'Footage', type: 'list', label: 'Keep ranges', default: [], help: 'Source seconds to keep, in order: [{"in":0.4,"out":6.2}].', fields: ['in', 'out'] },
  { id: 'words', record: RECORDS.words, group: 'Captions', type: 'list', label: 'Word timings', default: [], help: 'Source time: [{"w":"Hello","s":0.1,"e":0.4}]. Remapped through the keep ranges automatically.', fields: ['w', 's', 'e'] },
  { id: 'hook', group: 'Words', type: 'text', label: 'Hook title', default: '', help: 'Says the same thing as the first spoken line, in fewer words.' },
  { id: 'hookSeconds', group: 'Words', type: 'number', label: 'Hook on screen', default: 3, min: 1, max: 6, step: 0.1, unit: 's' },
  { id: 'hookPlace', group: 'Words', type: 'select', label: 'Hook position', default: 'top', options: [{ value: 'top', label: 'Above the head' }, { value: 'lower', label: 'Below the face' }], help: 'Keep the title off the face. Frame the speaker lower if it sits on top.' },
  { id: 'name', group: 'Words', type: 'line', label: 'Speaker name', default: '' },
  { id: 'role', group: 'Words', type: 'line', label: 'Speaker role', default: '' },
  { id: 'captionSize', group: 'Captions', type: 'number', label: 'Caption size', default: 72, min: 44, max: 110, step: 1, unit: 'px' },
  { id: 'captionStyle', group: 'Captions', type: 'select', label: 'Caption style', default: 'plate', options: ['plate', 'plain'] },
  { id: 'captionY', group: 'Captions', type: 'number', label: 'Caption height', default: 0.62, min: 0.3, max: 0.8, step: 0.01 },
  { id: 'activeWord', group: 'Captions', type: 'toggle', label: 'Mark the spoken word', default: true },
  { id: 'punch', group: 'Framing', type: 'number', label: 'Punch-in', default: 1.12, min: 1, max: 1.4, step: 0.01, unit: '×' },
  { id: 'focusX', group: 'Framing', type: 'number', label: 'Face across', default: 0.5, min: 0, max: 1, step: 0.01 },
  { id: 'focusY', group: 'Framing', type: 'number', label: 'Face height', default: 0.35, min: 0, max: 1, step: 0.01 },
  { id: 'broll', record: RECORDS.broll, group: 'B-roll', type: 'list', label: 'Inserts', default: [], help: 'Timeline seconds: [{"src":"assets/x.mp4","at":4,"dur":2}]. Speech keeps playing underneath.', fields: ['src', 'at', 'dur'] },
  ...finishControls(0.03),
];

export function build(ctx) {
  const { format: f, v, brand, mode } = ctx;
  const { w, h, safe } = f;
  const x = safe.left;
  const W = w - safe.left - safe.right;
  const edits = v.edits.length ? v.edits : [{ in: 0, out: 10 }];
  const segs = timelineFromEdits(edits);
  const total = segs.reduce((a, s) => a + s.duration, 0);
  const words = remapWords(v.words, edits);
  const media = (src, extra) => ({ kind: isVideo(src) ? 'video' : 'image', src, ...extra });

  const scenes = segs.map((seg, i) => ({
    id: `take-${i + 1}`, duration: mode === 'still' ? 1 : seg.duration, background: '#000',
    layers: [media(v.clip, {
      id: 'speaker', in: seg.in, focus: { x: v.focusX, y: v.focusY },
      // Alternate framing so a jump cut reads as a decision.
      tween: [{ prop: 'scale', from: i % 2 ? v.punch : 1, to: i % 2 ? v.punch : 1, dur: 1 }],
    })],
  }));

  const overlays = [];
  for (const b of v.broll) {
    overlays.push(media(b.src, {
      id: 'broll', in: b.in ?? 0, start: b.at, end: b.at + b.dur, still: false,
      box: { x: 0, y: 0, w, h }, focus: b.focus,
      tween: [{ prop: 'scale', from: 1.1, to: 1, dur: b.dur, ease: 'linear' }],
    }));
  }
  if (words.length) {
    overlays.push({
      kind: 'captions', id: 'captions', words, color: '#FFFFFF', activeColor: v.activeWord ? brand.accent : '#FFFFFF',
      plate: v.captionStyle === 'plate' ? 'rgba(10,9,8,.72)' : null, maxChars: 26, still: false,
      box: { x, y: Math.round(h * v.captionY), w: W, h: 300 },
      font: { ...sans(brand), size: v.captionSize, weight: 700, leading: 1.14, tracking: -0.005, align: 'center' },
    });
  }
  if (v.hook) {
    const lower = v.hookPlace === 'lower';
    const hookY = lower ? Math.round(h * v.captionY) - 330 : safe.top;
    overlays.push({
      kind: 'rect', id: 'hook-scrim', end: v.hookSeconds,
      box: lower ? { x: 0, y: hookY - 120, w, h: 560 } : { x: 0, y: 0, w, h: safe.top + 420 },
      fill: lower ? 'linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.55) 40%,rgba(0,0,0,0))' : 'linear-gradient(rgba(0,0,0,.62),rgba(0,0,0,0))',
    });
    overlays.push({
      kind: 'text', id: 'hook', text: v.hook, color: '#FFFFFF', box: { x, y: hookY, w: W, h: 300 },
      font: { ...sans(brand), weight: 800, fit: 'box', maxSize: 104, minSize: 56, leading: 1.03, tracking: -0.018 },
      in: 'rise', speed: 1.3, start: -0.28, end: v.hookSeconds, out: 'rise',
    });
  }
  if (v.name) {
    const y = Math.round(h * v.captionY) - 150;
    overlays.push({ kind: 'rect', id: 'tag-rule', box: { x, y: y + 4, w: 6, h: 92 }, fill: brand.accent, start: v.hookSeconds + 0.3, end: v.hookSeconds + 4.2, origin: '50% 0%', tween: [{ prop: 'scaleY', from: 0, to: 1, dur: 0.4, ease: 'out-expo' }] });
    overlays.push({
      kind: 'text', id: 'tag', role: 'label', text: v.role ? `${v.name}\n${v.role}` : v.name, color: '#FFFFFF', box: { x: x + 28, y, w: W - 28 },
      font: { ...sans(brand), size: 40, weight: 600, leading: 1.2 }, in: 'rise', start: v.hookSeconds + 0.4, end: v.hookSeconds + 4.2, out: 'fade',
    });
  }
  return {
    background: '#000', scenes, overlays, duration: mode === 'still' ? 1 : total,
    audio: v.clip ? segs.map((s) => ({ src: v.clip, in: s.in, duration: s.duration, at: s.at })) : [],
    finish: { grain: v.grain, vignette: v.vignette },
  };
}
