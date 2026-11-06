// Editorial quote: large phrase-ragged serif, one emphasised idea, optional image. Post and reel share this layout.
import { readSeconds, wordCount } from '../runtime/schema.js';

export const meta = {
  id: 'quote-editorial', name: 'Editorial quote', status: 'experimental',
  formats: ['reel', 'story', 'post', 'square'],
  summary: 'Large serif quote with one emphasised idea, optional image.',
};

export const controls = [
  { id: 'quote', group: 'Words', type: 'text', label: 'Quote', default: 'Forever\nis composed\nof *nows.*', help: 'Press return where a phrase ends. Wrap words in *asterisks* to emphasise them.' },
  { id: 'attribution', group: 'Words', type: 'line', label: 'Attribution', default: 'Emily Dickinson' },
  { id: 'label', group: 'Words', type: 'line', label: 'Small label', default: '' },
  { id: 'scale', group: 'Type', type: 'number', label: 'Quote size', default: 1, min: 0.5, max: 1.4, step: 0.01, unit: '×' },
  { id: 'leading', group: 'Type', type: 'number', label: 'Line spacing', default: 1.04, min: 0.86, max: 1.4, step: 0.01 },
  { id: 'tracking', group: 'Type', type: 'number', label: 'Letter spacing', default: -0.018, min: -0.05, max: 0.08, step: 0.001, unit: 'em' },
  { id: 'emphasis', group: 'Type', type: 'select', label: 'Emphasis', default: 'italic', options: ['italic', 'colour', 'underline', 'bar', 'none'] },
  { id: 'align', group: 'Layout', type: 'select', label: 'Alignment', default: 'left', options: ['left', 'center'] },
  { id: 'position', group: 'Layout', type: 'select', label: 'Quote position', default: 'middle', options: ['top', 'middle', 'bottom'] },
  { id: 'image', group: 'Image', type: 'asset', label: 'Image', default: '', accept: 'image' },
  { id: 'imageMode', group: 'Image', type: 'select', label: 'Image layout', default: 'full', options: ['full', 'inset'] },
  { id: 'imageFocusY', group: 'Image', type: 'number', label: 'Crop height', default: 0.5, min: 0, max: 1, step: 0.01 },
  { id: 'scrim', group: 'Image', type: 'number', label: 'Image darkening', default: 0.45, min: 0, max: 0.9, step: 0.01 },
  { id: 'reveal', group: 'Motion', type: 'select', label: 'Reveal', default: 'rise', options: ['rise', 'rise-words', 'resolve', 'track', 'flip', 'fade'] },
  { id: 'pace', group: 'Motion', type: 'select', label: 'Reveal pace', default: 'flowing', options: [{ value: 'flowing', label: 'Flowing' }, { value: 'reading', label: 'Line by line at reading speed' }] },
  { id: 'speed', group: 'Motion', type: 'number', label: 'Motion speed', default: 1, min: 0.5, max: 2, step: 0.05, unit: '×' },
  { id: 'hold', group: 'Motion', type: 'number', label: 'Extra hold', default: 1.2, min: 0, max: 8, step: 0.1, unit: 's' },
  { id: 'drift', group: 'Motion', type: 'number', label: 'Slow push', default: 0.03, min: 0, max: 0.12, step: 0.005 },
  { id: 'ending', group: 'Motion', type: 'select', label: 'Ending', default: 'hold', options: ['hold', 'fade', 'rise'] },
  { id: 'grain', group: 'Finish', type: 'number', label: 'Grain', default: 0.1, min: 0, max: 0.4, step: 0.01 },
  { id: 'vignette', group: 'Finish', type: 'number', label: 'Vignette', default: 0, min: 0, max: 0.6, step: 0.01 },
];

export function build(ctx) {
  const { format: f, v, brand, mode } = ctx;
  const { w, h, safe } = f;
  const hasImage = !!v.image;
  const full = hasImage && v.imageMode === 'full';
  const inset = hasImage && v.imageMode === 'inset';
  const dark = full;
  const ink = dark ? '#FFFFFF' : brand.ink;
  const quiet = dark ? 'rgba(255,255,255,.82)' : brand.muted;
  const accent = dark ? ink : brand.accent;
  const x = safe.left;
  const W = w - safe.left - safe.right;
  const top = safe.top;
  const bottom = h - safe.bottom;
  const insetH = inset ? Math.round((bottom - top) * 0.46) : 0;
  const creditRoom = v.attribution ? 150 : 0;
  const labelRoom = v.label ? 90 : 0;
  const areaTop = top + labelRoom + (inset ? insetH + 50 : 0);
  const areaH = bottom - areaTop - creditRoom;

  const words = wordCount(v.quote);
  const reading = v.pace === 'reading';
  const intro = reading ? 0.2 + words * 0.36 : 0.9;
  const duration = mode === 'still' ? 1 : intro + readSeconds(v.quote) + v.hold + (v.ending === 'hold' ? 0 : 0.7);

  const layers = [];
  if (full) {
    layers.push({
      kind: 'image', id: 'image', src: v.image, focus: { x: 0.5, y: v.imageFocusY },
      tween: [{ prop: 'scale', from: 1 + v.drift * 2, to: 1, dur: duration, ease: 'out-soft', rest: 1 }],
    });
    layers.push({ kind: 'rect', id: 'scrim', box: { x: 0, y: 0, w, h }, fill: `rgba(10,9,8,${v.scrim})` });
  }
  if (inset) {
    layers.push({
      kind: 'image', id: 'image', src: v.image, box: { x, y: top + labelRoom, w: W, h: insetH },
      focus: { x: 0.5, y: v.imageFocusY },
      reveal: { type: 'center', start: -0.4 / v.speed, dur: 0.75 / v.speed, ease: 'in-out-strong' },
      tween: [{ prop: 'scale', from: 1.14, to: 1, dur: 1.5 / v.speed, ease: 'out-expo', rest: 1 }],
    });
  }
  if (v.label) {
    layers.push({
      kind: 'text', id: 'label', role: 'label', text: v.label, color: quiet, box: { x, y: top, w: W },
      font: { family: brand.text, fallback: 'Helvetica, Arial, sans-serif', size: 32, weight: 500, tracking: 0.08, leading: 1.2, upper: true, align: v.align },
      in: 'fade', speed: v.speed,
    });
  }
  const em = v.emphasis === 'italic' ? { italic: true } : v.emphasis === 'colour' ? { color: accent } : {};
  const emphasis = ['underline', 'bar'].includes(v.emphasis) ? { style: v.emphasis, color: v.emphasis === 'bar' ? `${brand.accent}40` : accent } : undefined;
  layers.push({
    kind: 'text', id: 'quote', text: v.quote, color: ink,
    box: { x, y: areaTop, w: W, h: areaH }, valign: v.position === 'middle' && !inset ? 'centre' : v.position,
    font: {
      family: brand.display, fallback: 'Georgia, serif', fit: 'box', maxSize: 190 * v.scale, minSize: 40, leading: v.leading,
      tracking: v.tracking, align: v.align, hang: true, em,
    },
    emphasis,
    in: reading ? { preset: v.reveal, stagger: 0 } : v.reveal,
    perWord: reading ? 0.36 : 0,
    speed: v.speed,
    // Negative start: frame one opens mid-rise, so the hook is never a blank frame.
    start: -0.32 / v.speed,
    out: v.ending === 'hold' ? undefined : v.ending,
    tween: [{ prop: 'scale', from: 1, to: 1 + v.drift * 0.5, dur: duration, ease: 'linear', rest: 0 }],
    origin: v.align === 'center' ? '50% 50%' : '0% 50%',
  });
  if (v.attribution) {
    layers.push({
      kind: 'rect', id: 'rule', below: { id: 'quote', gap: 48 }, box: { x: v.align === 'center' ? w / 2 - 44 : x, w: 88, h: 3 }, fill: quiet,
      origin: v.align === 'center' ? '50% 50%' : '0% 50%',
      tween: [{ prop: 'scaleX', from: 0, to: 1, start: 0.75 / v.speed, dur: 0.7 / v.speed, ease: 'in-out-strong' }],
    });
    layers.push({
      kind: 'text', id: 'credit', role: 'credit', text: v.attribution, color: quiet, below: { id: 'rule', gap: 26 }, box: { x, w: W },
      font: { family: brand.text, fallback: 'Helvetica, Arial, sans-serif', size: 36, weight: 400, tracking: 0.01, leading: 1.25, align: v.align },
      in: 'fade', start: 0.95 / v.speed, speed: v.speed,
    });
  }
  return {
    background: full ? '#0B0A09' : brand.paper,
    scenes: [{ id: 'quote', duration, background: full ? '#0B0A09' : brand.paper, layers }],
    finish: { grain: v.grain, vignette: full ? Math.max(v.vignette, 0.25) : v.vignette },
    cues: [],
  };
}
