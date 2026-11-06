// Event promo: the story is in the clip order. Roles set shot length so energy rises, peaks, breathes, then reveals.
import { finishControls, isVideo, montagePlan, sans } from '../runtime/kit.js';

import { RECORDS } from '../runtime/records.js';

export const meta = {
  id: 'event-promo', name: 'Event promo', status: 'experimental',
  formats: ['reel', 'story', 'square', 'landscape'],
  summary: 'Beat-cut montage in acts, layered type, title reveal and details card.',
};

export const controls = [
  { id: 'clips', record: RECORDS.clips, group: 'Story', type: 'list', label: 'Clips in story order', default: [], help: 'Role: open, establish, people, detail, peak, breath. Optional: src, in, beats, focus, text.', fields: ['src', 'role', 'text'], choices: { role: ['open', 'establish', 'people', 'detail', 'peak', 'breath'] } },
  { id: 'hook', group: 'Words', type: 'text', label: 'Opening line', default: 'One night.\nEverything *changes.*', help: 'On screen from frame one, over your strongest clip.' },
  { id: 'title', group: 'Words', type: 'text', label: 'Event name', default: 'SUMMER\nGATHERING' },
  { id: 'date', group: 'Words', type: 'line', label: 'Date', default: 'Sat 14 June' },
  { id: 'place', group: 'Words', type: 'line', label: 'Place', default: 'The Old Hall' },
  { id: 'cta', group: 'Words', type: 'line', label: 'Call to action', default: 'Tickets at the link in bio' },
  { id: 'bpm', group: 'Timing', type: 'number', label: 'Music tempo', default: 112, min: 60, max: 180, step: 1, unit: 'bpm', help: 'Cuts land on these beats.' },
  { id: 'music', group: 'Sound', type: 'asset', label: 'Music', default: '', accept: 'audio' },
  { id: 'musicIn', group: 'Sound', type: 'number', label: 'Music starts at', default: 0, min: 0, max: 600, step: 0.01, unit: 's' },
  { id: 'musicGain', group: 'Sound', type: 'number', label: 'Music level', default: -6, min: -30, max: 0, step: 0.5, unit: 'dB' },
  { id: 'accents', group: 'Sound', type: 'toggle', label: 'Accent sounds', default: true },
  { id: 'titleFont', group: 'Type', type: 'font', label: 'Title typeface', default: 'Avenir Next Condensed' },
  { id: 'titleMode', group: 'Type', type: 'select', label: 'Title treatment', default: 'window', options: [{ value: 'window', label: 'Footage inside the letters' }, { value: 'solid', label: 'Solid over footage' }] },
  { id: 'kicker', group: 'Words', type: 'line', label: 'Corner tag', default: '' },
  { id: 'darken', group: 'Finish', type: 'number', label: 'Footage darkening', default: 0.16, min: 0, max: 0.7, step: 0.01 },
  ...finishControls(0.09),
];

export function build(ctx) {
  const { format: f, v, brand, mode, seed } = ctx;
  const { w, h, safe } = f;
  const x = safe.left;
  const W = w - safe.left - safe.right;
  const beat = 60 / v.bpm;
  const plan = montagePlan(v.clips.length ? v.clips : [{ role: 'open' }], v.bpm);
  const titleFont = { family: v.titleFont, fallback: 'Impact, Helvetica, sans-serif', weight: 800 };
  const small = { ...sans(brand), weight: 600, leading: 1.15 };

  const footage = (c, i, seconds, extra = {}) => {
    if (!c.src) return { kind: 'rect', id: 'missing', box: { x: 0, y: 0, w, h }, fill: brand.ink };
    const zoomIn = (i + seed) % 2 === 0;
    return {
      kind: isVideo(c.src) ? 'video' : 'image', id: 'clip', src: c.src, in: c.in ?? 0, focus: c.focus,
      tween: [{ prop: 'scale', from: zoomIn ? 1.02 : 1.12, to: zoomIn ? 1.12 : 1.02, dur: seconds, ease: 'linear', rest: 0.5 }],
      ...extra,
    };
  };
  const shade = { kind: 'rect', id: 'shade', box: { x: 0, y: 0, w, h }, fill: `rgba(8,7,6,${v.darken})` };

  const cues = [];
  let clock = 0;
  const scenes = plan.map((c, i) => {
    const layers = [footage(c, i, c.seconds), shade];
    const isOpen = i === 0;
    const line = isOpen ? v.hook : c.text;
    if (line) {
      layers.push({ kind: 'rect', id: 'lift', box: { x: 0, y: safe.top - 80, w, h: h - safe.top - safe.bottom + 160 }, fill: 'radial-gradient(ellipse 90% 55% at 40% 50%,rgba(0,0,0,.42),rgba(0,0,0,0))' });
      layers.push({
        kind: 'text', id: isOpen ? 'hook' : 'line', text: line, color: '#FFFFFF',
        box: { x, y: safe.top, w: W, h: h - safe.top - safe.bottom }, valign: isOpen ? 'centre' : 'bottom',
        font: { ...titleFont, fit: 'box', maxSize: isOpen ? 210 : 130, minSize: 60, leading: 0.98, tracking: -0.01, em: { color: brand.accent === '#000000' ? '#FFFFFF' : '#FFFFFF' } },
        emphasis: isOpen ? { style: 'underline', color: '#FFFFFF', dur: 0.4 } : undefined,
        in: isOpen ? 'rise' : 'rise-words', speed: isOpen ? 1.35 : 1.5, start: isOpen ? -0.28 : 0,
      });
    }
    if (c.role === 'peak' && plan[i - 1]?.role !== 'peak' && v.accents) cues.push({ at: clock, sound: 'rise', gain: -3 });
    clock += c.seconds;
    return { id: `${c.role}-${i + 1}`, duration: mode === 'still' ? 1 : c.seconds, background: '#000', layers };
  });

  // Title reveal: footage seen through the letters, then the details card.
  const hero = [...plan].reverse().find((c) => c.role === 'peak' || c.role === 'open') || plan[0];
  const titleSeconds = 8 * beat;
  const titleBox = { x, y: safe.top, w: W, h: h - safe.top - safe.bottom };
  const titleText = (color) => ({
    kind: 'text', id: 'title', text: v.title, color, box: titleBox, valign: 'centre',
    font: { ...titleFont, fit: 'lines', maxSize: 460, leading: 0.92, tracking: -0.008, upper: true },
    in: 'slide', speed: 1.2, start: 0,
  });
  const titleLayers = v.titleMode === 'window'
    ? [footage(hero, 1, titleSeconds), {
      kind: 'group', id: 'window', blend: 'screen',
      layers: [{ kind: 'rect', id: 'sheet', box: { x: 0, y: 0, w, h }, fill: brand.paper }, titleText('#000000')],
    }]
    : [footage(hero, 1, titleSeconds), shade, titleText('#FFFFFF')];
  if (v.accents) cues.push({ at: clock, sound: 'thud', gain: 6 });
  scenes.push({ id: 'title', duration: mode === 'still' ? 1 : titleSeconds, background: brand.paper, layers: titleLayers, transition: { type: 'bars', dur: 0.55, count: 5 } });
  clock += titleSeconds - 0.55;

  // Details: everything a viewer needs to act, on a calm card that can hold.
  const cardSeconds = 8 * beat + 1;
  const card = [
    { kind: 'text', id: 'name', role: 'label', text: v.title.replace(/\n/g, ' '), color: brand.paper, box: { x, y: safe.top, w: W }, font: { ...titleFont, size: 66, leading: 1, tracking: 0.005, upper: true }, in: 'rise', start: 0.32 },
    { kind: 'text', id: 'date', text: v.date, color: brand.paper, box: { x, y: safe.top + 180, w: W, h: 420 }, font: { ...titleFont, fit: 'box', maxSize: 240, minSize: 70, leading: 0.96, tracking: -0.01, upper: true }, in: 'rise', start: 0.45 },
    { kind: 'text', id: 'place', text: v.place, color: brand.paper, below: { id: 'date', gap: 26 }, box: { x, w: W }, font: { ...small, size: 60 }, in: 'rise', start: 0.65 },
    { kind: 'rect', id: 'rule', below: { id: 'place', gap: 54 }, box: { x, w: W, h: 3 }, fill: brand.paper, origin: '0% 50%', tween: [{ prop: 'scaleX', from: 0, to: 1, start: 0.85, dur: 0.7, ease: 'in-out-strong' }] },
    { kind: 'text', id: 'cta', text: v.cta, color: brand.paper, below: { id: 'rule', gap: 40 }, box: { x, w: W }, font: { ...small, size: 50 }, in: 'rise', start: 1.0 },
  ];
  scenes.push({ id: 'details', duration: mode === 'still' ? 1 : cardSeconds, background: brand.accent, layers: card, transition: { type: 'cover', dur: 0.55, dir: 'up' } });
  clock += cardSeconds - 0.55;

  const overlays = v.kicker && mode !== 'still' ? [{
    kind: 'text', id: 'kicker', role: 'label', text: v.kicker, color: '#FFFFFF', box: { x, y: safe.top - 70, w: W },
    font: { ...small, size: 32, tracking: 0.06, upper: true }, in: 'fade', end: clock - cardSeconds - titleSeconds + 0.6,
  }] : [];
  const audio = v.music ? [{ src: v.music, in: v.musicIn, gain: v.musicGain, duration: clock, fadeOut: 1.2 }] : [];
  return { background: '#000', scenes, overlays, cues, audio, duration: mode === 'still' ? 1 : clock, stillScene: scenes.length - 2, finish: { grain: v.grain, vignette: v.vignette } };
}
