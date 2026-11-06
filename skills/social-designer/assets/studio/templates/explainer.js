// Motion-graphics explainer: story beats with roles. Each beat has one job and one visual idea.
import { readSeconds } from '../runtime/schema.js';
import { finishControls, isVideo, sans, serif } from '../runtime/kit.js';

import { RECORDS } from '../runtime/records.js';

export const meta = {
  id: 'explainer', name: 'Motion explainer', status: 'experimental',
  formats: ['reel', 'story', 'post', 'square', 'landscape'],
  summary: 'Story beats built from statements, numbers, lists, comparisons and flows.',
};

const sample = [
  { role: 'hook', visual: 'statement', text: 'You don’t need\nmore *time.*' },
  { role: 'setup', visual: 'stat', value: 168, label: 'hours in every week.\nSame for everyone.' },
  { role: 'turn', visual: 'dots', value: 168, fill: 131, text: 'But most of it\nis already\n*spoken for.*' },
  { role: 'explain', visual: 'compare', left: 'Your calendar', right: 'Your priorities', leftItems: 'Meetings\nErrands\nScrolling', rightItems: 'Family\nHealth\nThe work' },
  { role: 'example', visual: 'list', text: 'Try this once:', items: 'Name one thing\nGive it a time\nProtect that time' },
  { role: 'payoff', visual: 'statement', text: 'Time isn’t found.\nIt’s *chosen.*' },
];

export const controls = [
  { id: 'beats', record: RECORDS.beats, group: 'Story', type: 'list', label: 'Beats', default: sample, help: 'Each beat has one job. Fields depend on the visual: stat uses value and label; dots uses value, fill and text; list and flow use items; compare uses left, right, leftItems and rightItems; image uses src and text.', fields: ['role', 'visual', 'text'], choices: { role: ['hook', 'setup', 'turn', 'explain', 'example', 'payoff', 'close'], visual: ['statement', 'stat', 'dots', 'list', 'compare', 'flow', 'image'] } },
  { id: 'handle', group: 'Words', type: 'line', label: 'Handle', default: '' },
  { id: 'style', group: 'Type', type: 'select', label: 'Type system', default: 'serif', options: ['serif', 'sans'] },
  { id: 'pace', group: 'Motion', type: 'number', label: 'Pace', default: 1, min: 0.6, max: 1.6, step: 0.05, unit: '×', help: 'Above 1 shortens every hold.' },
  { id: 'transition', group: 'Motion', type: 'select', label: 'Transition', default: 'push', options: ['push', 'cover', 'whip', 'dissolve', 'cut'] },
  { id: 'direction', group: 'Motion', type: 'select', label: 'Direction', default: 'up', options: ['up', 'left'] },
  { id: 'progress', group: 'Motion', type: 'toggle', label: 'Progress line', default: false },
  { id: 'cues', group: 'Sound', type: 'toggle', label: 'Transition sounds', default: true },
  ...finishControls(0.07),
];

const SCHEME = { hook: 'paper', setup: 'paper', turn: 'ink', explain: 'paper', example: 'paper', payoff: 'accent', close: 'ink' };
const lines = (s) => String(s || '').split('\n').filter(Boolean);

export function build(ctx) {
  const { format: f, v, brand, mode } = ctx;
  const { w, h, safe } = f;
  const x = safe.left;
  const W = w - safe.left - safe.right;
  const top = safe.top;
  const H = h - safe.top - safe.bottom;
  const face = v.style === 'serif' ? serif(brand) : sans(brand);
  const heavy = v.style === 'serif' ? 400 : 800;
  const small = { ...sans(brand), weight: 500, leading: 1.25 };
  const scheme = (beat) => {
    const bg = brand[SCHEME[beat.role] || 'paper'];
    const dark = (SCHEME[beat.role] || 'paper') !== 'paper';
    return { bg, ink: dark ? brand.paper : brand.ink, quiet: dark ? `${brand.paper}CC` : brand.muted, accent: dark ? brand.paper : brand.accent };
  };
  const overlap = v.transition === 'cut' ? 0 : v.transition === 'whip' ? 0.42 : v.transition === 'dissolve' ? 0.6 : 0.6;
  const settle = overlap * 0.55;

  const statement = (b, c, start) => [{
    kind: 'text', id: 'line', text: b.text, color: c.ink, box: { x, y: top, w: W, h: H }, valign: 'centre',
    font: { ...face, weight: heavy, fit: 'box', maxSize: 190, minSize: 56, leading: 1.04, tracking: -0.02, em: v.style === 'serif' ? { italic: true } : { color: c.accent } },
    in: 'rise', start,
  }];
  const stat = (b, c, start) => [{
    kind: 'counter', id: 'value', from: b.from ?? 0, to: b.value, prefix: b.prefix || '', suffix: b.suffix || '', decimals: b.decimals || 0,
    color: c.ink, box: { x, y: top + H * 0.2, w: W }, start, dur: 1.1, ease: 'out-expo',
    font: { ...face, weight: heavy, maxSize: 420, tracking: -0.03 },
  }, {
    kind: 'text', id: 'label', text: b.label || '', color: c.quiet, below: { id: 'value', gap: 34 }, box: { x, w: W * 0.9 },
    font: { ...small, size: 56 }, in: 'rise', start: start + 0.3,
  }];
  const list = (b, c, start, seconds) => {
    const items = lines(b.items);
    const head = b.text ? [{
      kind: 'text', id: 'head', text: b.text, color: c.quiet, box: { x, y: top + H * 0.12, w: W }, font: { ...small, size: 54 }, in: 'rise', start,
    }] : [];
    const gap = Math.min(0.9, (seconds - 1.6) / Math.max(1, items.length));
    const out = [...head];
    const row = (H * 0.76) / Math.max(1, items.length);
    items.forEach((text, i) => {
      const y = top + H * 0.2 + i * row;
      const at = start + 0.25 + i * gap;
      out.push({ kind: 'rect', id: `r${i}`, box: { x, y: y - 22, w: W, h: 2 }, fill: c.quiet, opacity: 0.5, origin: '0% 50%', tween: [{ prop: 'scaleX', from: 0, to: 1, start: at - 0.1, dur: 0.6, ease: 'in-out-strong' }] });
      out.push({ kind: 'text', id: `n${i}`, role: 'label', text: String(i + 1), color: c.accent, box: { x, y, w: 100 }, font: { ...sans(brand), size: 40, weight: 600, leading: 1.2 }, in: 'fade', start: at });
      out.push({ kind: 'text', id: `i${i}`, text, color: c.ink, box: { x, y: y + 50, w: W, h: row - 80 }, font: { ...face, weight: heavy, fit: 'box', maxSize: 118, minSize: 60, leading: 1.04, tracking: -0.018 }, in: 'rise', start: at });
    });
    return out;
  };
  const compare = (b, c, start) => {
    const colW = (W - 50) / 2;
    const column = (title, items, cx, at, id, strong) => [
      { kind: 'text', id: `${id}h`, role: 'label', text: title, color: strong ? c.accent : c.quiet, box: { x: cx, y: top + H * 0.12, w: colW }, font: { ...small, size: 44, weight: 600 }, in: 'rise', start: at },
      ...lines(items).map((text, i) => ({
        kind: 'text', id: `${id}${i}`, text, color: strong ? c.ink : c.quiet, box: { x: cx, y: top + H * 0.26 + i * (H * 0.2), w: colW, h: H * 0.18 },
        font: { ...face, weight: heavy, fit: 'box', maxSize: 92, minSize: 48, leading: 1.03, tracking: -0.016 }, in: 'rise', start: at + 0.12 + i * 0.1,
      })),
    ];
    return [
      { kind: 'rect', id: 'divider', box: { x: x + colW + 24, y: top + H * 0.12, w: 2, h: H * 0.76 }, fill: c.quiet, origin: '50% 0%', tween: [{ prop: 'scaleY', from: 0, to: 1, start, dur: 0.7, ease: 'in-out-strong' }] },
      ...column(b.left, b.leftItems, x, start, 'l', false),
      ...column(b.right, b.rightItems, x + colW + 50, start + 0.55, 'r', true),
    ];
  };
  const flow = (b, c, start) => {
    const items = lines(b.items);
    const step = (H * 0.8) / Math.max(1, items.length);
    const out = [];
    items.forEach((text, i) => {
      const y = top + H * 0.08 + i * step, at = start + i * 0.55;
      out.push({ kind: 'rect', id: `d${i}`, box: { x, y: y + 22, w: 30, h: 30 }, fill: c.accent, radius: 15, tween: [{ prop: 'scale', from: 0, to: 1, start: at, dur: 0.4, ease: 'overshoot' }] });
      if (i < items.length - 1) out.push({ kind: 'rect', id: `c${i}`, box: { x: x + 14, y: y + 56, w: 3, h: step - 42 }, fill: c.quiet, origin: '50% 0%', tween: [{ prop: 'scaleY', from: 0, to: 1, start: at + 0.25, dur: 0.45, ease: 'in-out' }] });
      out.push({ kind: 'text', id: `f${i}`, text, color: c.ink, box: { x: x + 66, y, w: W - 66 }, font: { ...face, weight: heavy, size: 76, leading: 1.06, tracking: -0.012 }, in: 'rise', start: at + 0.05 });
    });
    return out;
  };
  const image = (b, c, start, seconds) => [
    { kind: isVideo(b.src) ? 'video' : 'image', id: 'image', src: b.src, focus: b.focus, tween: [{ prop: 'scale', from: 1.1, to: 1, dur: seconds, ease: 'out-soft', rest: 1 }] },
    { kind: 'rect', id: 'scrim', box: { x: 0, y: 0, w, h }, fill: 'rgba(10,9,8,.4)' },
    ...(b.text ? [{ kind: 'text', id: 'line', text: b.text, color: '#FFFFFF', box: { x, y: top, w: W, h: H }, valign: 'bottom', font: { ...face, weight: heavy, fit: 'box', maxSize: 150, minSize: 56, leading: 1.04, tracking: -0.02, em: { italic: v.style === 'serif' } }, in: 'rise', start }] : []),
  ];
  // A quantity you can see: every unit drawn, the claimed share filling in.
  const dots = (b, c, start) => {
    const total = b.value, filled = b.fill ?? 0;
    const cols = b.cols ?? 14;
    const rows = Math.ceil(total / cols);
    // The picture never takes the words' room: dots stop at just over half the safe height.
    const gap = Math.min(W / cols, (H * 0.56) / rows);
    const size = gap * 0.64;
    const out = [];
    for (let i = 0; i < total; i++) {
      const cx = x + (i % cols) * gap, cy = top + Math.floor(i / cols) * gap;
      const on = i < filled;
      out.push({
        kind: 'rect', id: `dot${i}`, box: { x: cx, y: cy, w: size, h: size }, radius: size / 2, fill: on ? c.accent : c.quiet, opacity: on ? 1 : 0.32,
        tween: on ? [{ prop: 'scale', from: 0.42, to: 1, start: start + 0.25 + i * 0.008, dur: 0.4, ease: 'overshoot' }] : [],
      });
    }
    if (b.text) {
      out.push({
        kind: 'text', id: 'line', text: b.text, color: c.ink, box: { x, y: top + rows * gap + 36, w: W, h: H - rows * gap - 36 },
        font: { ...face, weight: heavy, fit: 'box', maxSize: 104, minSize: 56, leading: 1.04, tracking: -0.018, em: v.style === 'serif' ? { italic: true } : { color: c.accent } },
        in: 'rise', start: start + 0.5,
      });
    }
    return out;
  };
  const makers = { statement, stat, dots, list, compare, flow, image };
  const contentWords = (b) => [b.text, b.label, b.items, b.leftItems, b.rightItems].filter(Boolean).join(' ');

  const cues = [];
  const audio = [];
  let clock = 0;
  const scenes = v.beats.map((b, i) => {
    const c = scheme(b);
    const first = i === 0;
    const staged = b.visual === 'list' || b.visual === 'compare' || b.visual === 'flow' ? 1.3 : 0.5;
    const seconds = mode === 'still' ? 1 : (b.duration ?? (readSeconds(contentWords(b)) + staged) / v.pace) + (first ? 0 : overlap);
    // The hook opens mid-motion; later beats arrive as the transition settles.
    const start = first ? -0.3 : settle;
    const make = makers[b.visual] || statement;
    const at = first ? 0 : clock - overlap;
    if (!first && v.cues && v.transition !== 'cut') cues.push({ at, sound: 'whoosh' });
    if (b.voice) audio.push({ src: b.voice, at: at + (first ? 0 : settle) });
    clock = at + seconds;
    return {
      id: `${b.role}-${i + 1}`, duration: seconds, background: c.bg, layers: make(b, c, start, seconds),
      transition: first ? undefined : v.transition === 'cut' ? 'cut' : { type: v.transition, dir: v.direction },
    };
  });
  const overlays = [];
  if (v.progress && mode !== 'still') {
    overlays.push({ kind: 'rect', id: 'progress', box: { x, y: safe.top - 60, w: W, h: 5 }, fill: `${brand.muted}55`, blend: 'difference', origin: '0% 50%', tween: [{ prop: 'scaleX', from: 0, to: 1, dur: clock, ease: 'linear' }] });
  }
  if (v.handle) {
    overlays.push({ kind: 'text', id: 'handle', role: 'label', text: v.handle, color: '#FFFFFF', blend: 'difference', box: { x, y: h - safe.bottom - 40, w: W }, font: { ...small, size: 32 }, in: 'none' });
  }
  return { background: brand.paper, scenes, overlays, audio, cues, duration: mode === 'still' ? 1 : clock, finish: { grain: v.grain, vignette: v.vignette } };
}
