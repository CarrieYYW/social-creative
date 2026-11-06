// Craft checks that run against real layout. Each finding names the rule so feedback can refer to it.
import { WEAK_ENDS } from './text.js';
import { fontAvailable } from './engine.js';
import { wordCount } from './schema.js';

const bare = (w) => w.toLowerCase().replace(/[^\p{L}'’]/gu, '');

export function lintStudio(studio) {
  const out = [];
  const add = (level, rule, message, where = '') => out.push({ level, rule, message, where });
  const { format } = studio.ctx;
  const safe = format.safe;
  const video = studio.mode === 'video' && studio.duration > 0.2;
  const families = new Set();
  const seenWeak = new Set();

  for (const { layer, scene } of studio.textLayers()) {
    const l = layer.spec;
    const where = `${scene ? `scene ${scene.index + 1} ` : ''}${l.id || 'text'}`;
    const raw = String(l.text ?? '');
    families.add(l.font.family);
    if (l.font.em?.family) families.add(l.font.em.family);

    if (/["']/.test(raw.replace(/\d['"]/g, ''))) add('warn', 'straight-quotes', 'Use curly quotes and apostrophes (“ ” ‘ ’).', where);
    if (/ -{1,2} |--/.test(raw)) add('warn', 'dash', 'Use a real dash (– or —), not hyphens.', where);
    if (/ {2,}/.test(raw)) add('info', 'double-space', 'Remove double spaces.', where);

    const { lines } = layer.text;
    const body = l.role !== 'label' && l.role !== 'credit';
    if (body) {
      lines.forEach((line, i) => {
        const last = line.words[line.words.length - 1];
        if (i < lines.length - 1 && WEAK_ENDS.has(bare(last)) && !seenWeak.has(where + i)) {
          seenWeak.add(where + i);
          add('warn', 'weak-line-end', `Line ${i + 1} ends on “${last}”. Break before it so each line is a phrase.`, where);
        }
      });
      const lastLine = lines[lines.length - 1];
      if (lines.length > 2 && lastLine.words.length === 1 && lastLine.w < 0.33 * Math.max(...lines.map((x) => x.w))) {
        add('warn', 'widow', `The last line is one short word (“${lastLine.words[0]}”).`, where);
      }
    }

    // 1080 px wide on a ~390 pt phone is about 2.8 px per point.
    const smallest = Math.min(...lines.map((x) => x.size));
    const floor = l.role === 'label' || l.role === 'credit' ? 30 : 44;
    if (smallest < floor) add('warn', 'small-type', `${Math.round(smallest)} px is about ${Math.round(smallest / 2.77)} pt on a phone. Aim for ${floor} px or more.`, where);

    const b = layer.bounds;
    if (b) {
      const left = b.x + Math.min(...lines.map((x) => x.left));
      const right = b.x + Math.max(...lines.map((x) => x.left + x.w));
      const top = b.y, bottom = b.y + layer.text.height;
      if (l.ignoreSafe !== true) {
        const hits = [];
        if (top < safe.top - 1) hits.push(`top by ${Math.round(safe.top - top)} px`);
        if (bottom > format.h - safe.bottom + 1) hits.push(`bottom by ${Math.round(bottom - (format.h - safe.bottom))} px`);
        if (left < safe.left - 1) hits.push(`left by ${Math.round(safe.left - left)} px`);
        if (right > format.w - safe.right + 1) hits.push(`right by ${Math.round(right - (format.w - safe.right))} px`);
        if (hits.length) add('warn', 'safe-zone', `Outside the ${format.id} safe area: ${hits.join(', ')}.`, where);
      }
      if (right > format.w || left < 0 || bottom > format.h || top < 0) add('error', 'clipped', 'Text runs off the canvas.', where);
    }

    if (video && l.role !== 'label' && l.role !== 'credit') {
      const fullyIn = layer.text.inEnd;
      const visibleFrom = fullyIn;
      const holdEnd = layer.end - layer.start - layer.text.exitSpan;
      const hold = holdEnd - visibleFrom;
      const words = wordCount(raw);
      const need = Math.max(5 / 6, words / 3);
      if (hold < need - 0.01) {
        add('warn', 'read-time', `${words} words hold complete for ${hold.toFixed(1)} s. Allow at least ${need.toFixed(1)} s.`, where);
      }
    }
  }

  for (const family of families) {
    if (!fontAvailable(family)) add('error', 'missing-font', `“${family}” is not available, so a fallback is showing. Add it to brand.fonts.`, '');
  }

  const walk = (layers, fn) => { for (const l of layers) { fn(l); if (l.children) walk(l.children, fn); } };
  for (const s of studio.scenes) walk(s.layers, (l) => {
    if (l.broken) add('error', 'missing-media', `Could not load ${l.spec.src}.`, `scene ${s.index + 1}`);
  });
  walk(studio.overlays || [], (l) => {
    if (l.broken) add('error', 'missing-media', `Could not load ${l.spec.src}.`, `overlay ${l.id || ''}`.trim());
  });

  if (video) {
    // Story and hook. Thresholds are working heuristics, not platform rules.
    const story = studio.project.story || {};
    const opening = studio.scenes[0];
    const body = (l) => l.kind === 'text' && l.spec.role !== 'label' && l.spec.role !== 'credit';
    const texts = [...opening.layers.filter(body), ...studio.overlays.filter((l) => body(l) && l.start <= 0.5)];
    const firstRead = texts.length ? Math.min(...texts.map((l) => l.start + l.text.firstRead)) : Infinity;
    const fromFrameOne = (l) => l.start === 0 && (!l.spec.reveal || (l.spec.reveal.start ?? 0) < 0) && (l.kind === 'image' || l.kind === 'video');
    const hasPicture = opening.layers.some(fromFrameOne);
    if (firstRead > 1) {
      add('warn', 'hook-late', texts.length
        ? `First words read at ${firstRead.toFixed(1)} s. Bring the hook in within about a second.`
        : 'The opening has no readable words. Check the picture alone makes the subject clear.');
    }
    if (!hasPicture && firstRead > 0.5) add('warn', 'empty-open', 'The first frame is nearly empty. Open on the subject, not a blank background.');
    if (!story.promise) add('info', 'story-promise', 'Add story.promise: what the opening makes the viewer want to know.');
    if (!story.payoff) add('info', 'story-payoff', 'Add story.payoff: how the video answers that.');
    if (!story.shareReason) add('info', 'story-share', 'Add story.shareReason: what someone is saying when they send this.');

    const kinds = new Set(studio.scenes.filter((s) => s.transition).map((s) => s.transition.options.type));
    if (kinds.size > 2) add('info', 'transition-variety', `${kinds.size} transition types in one piece. One or two usually read as a system; more read as effects.`);
    if (studio.duration > 90) add('info', 'long', `${Math.round(studio.duration)} s is long for short-form. Check the destination.`);
    if (studio.step > 3) add('info', 'step', 'Stepped time above 3 frames can make reading harder.');
  }
  return out;
}

// Contrast against whatever is actually behind the text, from a screenshot with text hidden.
// `pixelsFor(rect)` returns RGBA data for a stage rectangle.
export function luminance([r, g, b]) {
  const f = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export const contrastRatio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export function contrastOf(textRgb, data) {
  const ratios = [];
  for (let i = 0; i < data.length; i += 16) ratios.push(contrastRatio(textRgb, [data[i], data[i + 1], data[i + 2]]));
  ratios.sort((a, b) => a - b);
  return { worst: ratios[Math.floor(ratios.length * 0.05)] ?? 21, median: ratios[Math.floor(ratios.length / 2)] ?? 21 };
}
