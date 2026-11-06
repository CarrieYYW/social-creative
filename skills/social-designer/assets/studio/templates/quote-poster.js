// Poster quote: every line set to the full measure in heavy condensed type. Loud where editorial is quiet.
import { readSeconds } from '../runtime/schema.js';
import { finishControls, sans } from '../runtime/kit.js';

export const meta = {
  id: 'quote-poster', name: 'Poster quote', status: 'experimental',
  formats: ['reel', 'story', 'post', 'square'],
  summary: 'Heavy full-width stacked type on a strong colour.',
};

export const controls = [
  { id: 'quote', group: 'Words', type: 'text', label: 'Quote', default: 'Done\nis better\nthan *perfect.*', help: 'Each line fills the width, so short lines get big. Wrap words in *asterisks* for the highlight.' },
  { id: 'attribution', group: 'Words', type: 'line', label: 'Attribution', default: 'Sample copy' },
  { id: 'font', group: 'Type', type: 'font', label: 'Typeface', default: 'Avenir Next Condensed' },
  { id: 'weight', group: 'Type', type: 'number', label: 'Weight', default: 800, min: 400, max: 900, step: 100 },
  { id: 'leading', group: 'Type', type: 'number', label: 'Line spacing', default: 0.94, min: 0.8, max: 1.2, step: 0.01 },
  { id: 'uppercase', group: 'Type', type: 'toggle', label: 'Capitals', default: true },
  { id: 'background', group: 'Colour', type: 'select', label: 'Background', default: 'accent', options: ['accent', 'ink', 'paper'] },
  { id: 'highlight', group: 'Colour', type: 'select', label: 'Highlight', default: 'bar', options: ['bar', 'underline', 'none'] },
  { id: 'reveal', group: 'Motion', type: 'select', label: 'Reveal', default: 'slide', options: ['slide', 'rise', 'settle', 'snap'] },
  { id: 'speed', group: 'Motion', type: 'number', label: 'Motion speed', default: 1, min: 0.5, max: 2, step: 0.05, unit: '×' },
  { id: 'hold', group: 'Motion', type: 'number', label: 'Extra hold', default: 1.4, min: 0, max: 8, step: 0.1, unit: 's' },
  { id: 'ending', group: 'Motion', type: 'select', label: 'Ending', default: 'slide', options: ['hold', 'slide', 'fade'] },
  ...finishControls(0.07),
];

export function build(ctx) {
  const { format: f, v, brand, mode } = ctx;
  const { w, h, safe } = f;
  const bg = brand[v.background];
  const fg = v.background === 'paper' ? brand.ink : brand.paper;
  const x = safe.left;
  const W = w - safe.left - safe.right;
  const areaH = h - safe.top - safe.bottom - (v.attribution ? 110 : 0);
  const duration = mode === 'still' ? 1 : 0.8 + readSeconds(v.quote) + v.hold + (v.ending === 'hold' ? 0 : 0.7);
  const layers = [{
    kind: 'text', id: 'quote', text: v.quote, color: fg, box: { x, y: safe.top, w: W, h: areaH }, valign: 'centre',
    font: { family: v.font, fallback: 'Impact, Helvetica, sans-serif', weight: v.weight, fit: 'lines', maxSize: 620, leading: v.leading, tracking: -0.012, upper: v.uppercase, align: 'left' },
    emphasis: v.highlight === 'none' ? undefined : { style: v.highlight, color: v.highlight === 'bar' ? (v.background === 'paper' ? brand.accent : brand.ink) : fg, dur: 0.45 },
    in: v.reveal, speed: v.speed, start: -0.34 / v.speed, out: v.ending === 'hold' ? undefined : v.ending,
  }];
  if (v.attribution) {
    layers.push({
      kind: 'text', id: 'credit', role: 'credit', text: v.attribution, color: fg, below: { id: 'quote', gap: 34 }, box: { x, w: W },
      font: { ...sans(brand), size: 36, weight: 500, tracking: 0.02, leading: 1.2 }, in: 'fade', start: 0.7, speed: v.speed,
      out: v.ending === 'hold' ? undefined : 'fade',
    });
  }
  return { background: bg, scenes: [{ id: 'quote', duration, background: bg, layers }], finish: { grain: v.grain, vignette: v.vignette } };
}
