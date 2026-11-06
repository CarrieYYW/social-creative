// Typography: phrase-aware wrapping, fit-to-box sizing, kerning-preserving splitting and text animators.
import { curve, clamp, lerp, rng } from './easing.js';

// Words a line should not end on: articles, prepositions, conjunctions, possessives, auxiliaries.
export const WEAK_ENDS = new Set(
  'a an the of to in on at by for from with into onto over under and or but nor so as if that than my your our his her their its is are was were be i we he she they not'.split(' ')
);
const bareWord = (w) => w.toLowerCase().replace(/[^\p{L}'’]/gu, '');

export const TYPE_PRESETS = {
  none: { unit: 'line', dur: 0, stagger: 0, from: {} },
  fade: { unit: 'line', dur: 0.7, stagger: 0.12, ease: 'out-soft', from: { opacity: 0 } },
  rise: { unit: 'line', mask: 'line', dur: 1.0, stagger: 0.11, ease: 'out-expo', from: { y: 1.35 } },
  'rise-words': { unit: 'word', mask: 'word', dur: 0.8, stagger: 0.05, ease: 'out-expo', from: { y: 1.35 } },
  resolve: { unit: 'word', dur: 1.0, stagger: 0.07, ease: 'out-soft', from: { opacity: 0, blur: 0.09, y: 0.06 } },
  track: { unit: 'char', dur: 1.2, stagger: 0, ease: 'out-expo', from: { opacity: 0, spread: 0.28 } },
  type: { unit: 'char', dur: 0.001, stagger: 0.035, ease: 'step', from: { opacity: 0 } },
  settle: { unit: 'word', dur: 0.55, stagger: 0.09, ease: 'overshoot', from: { opacity: 0, scale: 0.86 } },
  snap: { unit: 'word', dur: 0.001, stagger: 0.16, ease: 'step', from: { opacity: 0 } },
  slide: { unit: 'line', mask: 'line', dur: 0.75, stagger: 0.07, ease: 'in-out-strong', from: { xw: 1.05 }, alternate: true },
  flip: { unit: 'line', dur: 0.8, stagger: 0.1, ease: 'out-expo', from: { rotateX: -82, opacity: 0, y: 0.25 } },
  scatter: { unit: 'char', dur: 0.8, stagger: 0.012, order: 'random', ease: 'out-expo', from: { opacity: 0, y: 0.5, rotate: 7 } },
};
export const EXIT_PRESETS = {
  none: null,
  fade: { dur: 0.45, ease: 'in-soft', to: { opacity: 0 } },
  rise: { unit: 'line', mask: 'line', dur: 0.55, stagger: 0.05, ease: 'in-strong', to: { y: -1.35 } },
  fall: { unit: 'line', mask: 'line', dur: 0.55, stagger: 0.05, ease: 'in-strong', to: { y: 1.35 } },
  blur: { dur: 0.5, ease: 'in-soft', to: { opacity: 0, blur: 0.07 } },
  slide: { unit: 'line', mask: 'line', dur: 0.5, stagger: 0.04, ease: 'in-out-strong', to: { xw: -1.05 }, alternate: true },
};

export function parseText(src, { upper = false } = {}) {
  const text = upper ? String(src).toUpperCase() : String(src);
  let em = false;
  return text.split('\n').map((raw) => {
    const words = [];
    for (const token of raw.trim().split(/\s+/).filter(Boolean)) {
      let t = token;
      const opens = t.startsWith('*') || /^[“"‘(]\*/.test(t);
      if (opens) { em = true; t = t.replace('*', ''); }
      const closes = t.includes('*');
      t = t.replace(/\*/g, '');
      words.push({ text: t, em });
      if (closes) em = false;
    }
    return words;
  });
}

const fontCss = (s, em, size) => {
  const e = em ? s.em || {} : {};
  const family = e.family || s.family;
  return {
    fontFamily: `"${family}", ${s.fallback || 'Georgia, serif'}`,
    fontWeight: e.weight ?? s.weight ?? 400,
    fontStyle: (e.italic ?? s.italic) ? 'italic' : 'normal',
    fontStretch: s.stretch || 'normal',
    letterSpacing: `${s.tracking ?? 0}em`,
    fontSize: `${size}px`,
    fontKerning: 'normal',
    fontFeatureSettings: s.features || 'normal',
  };
};

function measurer(host, style) {
  const span = document.createElement('span');
  span.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:0;top:0';
  host.appendChild(span);
  const cache = new Map();
  const width = (text, em) => {
    const k = (em ? '1' : '0') + text;
    if (!cache.has(k)) {
      Object.assign(span.style, fontCss(style, em, 100));
      span.textContent = text;
      cache.set(k, span.getBoundingClientRect().width);
    }
    return cache.get(k);
  };
  return { width, done: () => span.remove() };
}

const lineWidth = (words, m) => words.reduce((sum, w, i) => sum + m.width(w.text, w.em) + (i ? m.width(' ', false) : 0), 0);

// Dynamic-programming wrap. Cost prefers even lines and penalises breaks inside a phrase.
export function wrapWords(words, m, max) {
  const n = words.length;
  const best = new Array(n + 1).fill(Infinity);
  const prev = new Array(n + 1).fill(0);
  best[0] = 0;
  const target = max * 0.9;
  for (let j = 1; j <= n; j++) {
    for (let i = j - 1; i >= 0; i--) {
      const seg = words.slice(i, j);
      const w = lineWidth(seg, m);
      if (w > max && j - i > 1) break;
      const last = words[j - 1].text;
      let cost = ((target - Math.min(w, target)) / max) ** 2 * 100;
      if (w > max) cost += 500;
      if (j < n) {
        if (/[.!?;:—]["”’)]?$/.test(last)) cost -= 22;
        else if (/,["”’)]?$/.test(last)) cost -= 14;
        if (WEAK_ENDS.has(bareWord(last))) cost += 45;
      } else {
        if (j - i === 1 && n > 2) cost += 60; // widow
        cost *= 0.35; // a short last line is natural
      }
      if (best[i] + cost < best[j]) { best[j] = best[i] + cost; prev[j] = i; }
    }
  }
  const lines = [];
  for (let j = n; j > 0; j = prev[j]) lines.unshift(words.slice(prev[j], j));
  return lines;
}

// Decide size and lines. s.fit: 'none' | 'box' | 'lines'.
export function composeText(host, layer) {
  const s = layer.font;
  const m = measurer(host, s);
  const hard = parseText(layer.text, { upper: s.upper }).filter((l) => l.length);
  const W = layer.box.w, H = layer.box.h ?? Infinity;
  const leading = s.leading ?? 1.1;
  let out;
  if (s.fit === 'lines') {
    const lines = hard.flatMap((l) => (s.wrapLines ? wrapWords(l, m, s.wrapLines) : [l]));
    const rows = lines.map((words) => {
      const big = !s.fitEmphasisOnly || words.some((w) => w.em);
      const w100 = lineWidth(words, m);
      const size = big ? Math.min((W / w100) * 100, s.maxSize ?? 1200) : s.smallSize ?? (s.size || 80);
      return { words, size, big };
    });
    const total = rows.reduce((a, r) => a + r.size * leading, 0);
    const k = total > H ? H / total : 1;
    rows.forEach((r) => { r.size *= k; });
    out = rows;
  } else if (s.fit === 'box') {
    const fits = (size) => {
      const lines = hard.flatMap((l) => (lineWidth(l, m) * size) / 100 <= W ? [l] : wrapWords(l, m, (W / size) * 100));
      const ok = lines.length * size * leading <= H && lines.every((l) => (lineWidth(l, m) * size) / 100 <= W + 0.5);
      return { ok, lines };
    };
    let lo = s.minSize ?? 28, hi = s.maxSize ?? 240;
    if (hi < lo) lo = hi;
    // Hard line breaks are the writer's phrasing, so they win over a bigger size.
    if (hard.length > 1) {
      const widest = Math.max(...hard.map((l) => lineWidth(l, m)));
      const keep = Math.min(hi, (W / widest) * 100, H / (hard.length * leading));
      if (keep >= lo) {
        m.done();
        return hard.map((words) => ({ words, size: keep, big: true }));
      }
    }
    let chosen = fits(lo);
    let size = lo;
    if (fits(hi).ok) { size = hi; chosen = fits(hi); }
    else for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      const r = fits(mid);
      if (r.ok) { lo = mid; size = mid; chosen = r; } else hi = mid;
    }
    out = chosen.lines.map((words) => ({ words, size, big: true }));
  } else {
    const size = s.size ?? 64;
    const lines = hard.flatMap((l) => (lineWidth(l, m) * size) / 100 <= W ? [l] : wrapWords(l, m, (W / size) * 100));
    out = lines.map((words) => ({ words, size, big: true }));
  }
  m.done();
  return out;
}

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const graphemes = (t) => (segmenter ? [...segmenter.segment(t)].map((x) => x.segment) : [...t]);

function resolveAnim(spec, table) {
  if (!spec) return null;
  const base = typeof spec === 'string' ? table[spec] : { ...(table[spec.preset] || {}), ...spec };
  return base ? { ...base } : null;
}

// Builds the block. Lays text out naturally, records real unit positions, then re-places units absolutely,
// so kerning and ligature-free spacing at rest match unsplit text.
export function buildText(host, layer) {
  const s = layer.font;
  const rows = composeText(host, layer);
  const leading = s.leading ?? 1.1;
  const anim = resolveAnim(layer.in ?? 'none', TYPE_PRESETS) || TYPE_PRESETS.none;
  const exit = resolveAnim(layer.out ?? 'none', EXIT_PRESETS);
  const unit = anim.unit || 'line';
  const mask = anim.mask || (exit && exit.mask) || null;
  const align = s.align || 'left';
  const block = document.createElement('div');
  block.className = 'text-block';
  block.style.cssText = `position:absolute;left:0;top:0;width:${layer.box.w}px;color:${layer.color};`;
  host.appendChild(block);

  let y = 0;
  const lines = [];
  const units = [];
  const marks = [];
  rows.forEach((row, li) => {
    const lh = row.size * leading;
    const line = document.createElement('div');
    line.className = 'line';
    line.style.cssText = `position:absolute;top:${y}px;left:0;height:${lh}px;line-height:${lh}px;white-space:pre;`;
    Object.assign(line.style, fontCss(s, false, row.size));
    block.appendChild(line);
    // Natural pass.
    const spans = row.words.map((w, i) => {
      if (i) line.appendChild(document.createTextNode(' '));
      const sp = document.createElement('span');
      Object.assign(sp.style, fontCss(s, w.em, row.size));
      if (w.em && s.em?.color) sp.style.color = s.em.color;
      sp.textContent = w.text;
      line.appendChild(sp);
      return sp;
    });
    const natural = line.getBoundingClientRect();
    const naturalW = natural.width || spans.reduce((a, b) => Math.max(a, b.getBoundingClientRect().right - natural.left), 0);
    const hangChar = s.hang && align === 'left' && /^[“"‘'(]/.test(row.words[0]?.text || '') ? row.words[0].text[0] : null;
    let hang = 0;
    if (hangChar) {
      const r = document.createRange();
      r.setStart(spans[0].firstChild, 0); r.setEnd(spans[0].firstChild, 1);
      hang = r.getBoundingClientRect().width;
    }
    const left = align === 'center' ? (layer.box.w - naturalW) / 2 : align === 'right' ? layer.box.w - naturalW : -hang;
    const items = [];
    spans.forEach((sp, wi) => {
      const node = sp.firstChild;
      const rect = (a, b) => {
        const r = document.createRange();
        r.setStart(node, a); r.setEnd(node, b);
        return r.getBoundingClientRect();
      };
      const word = row.words[wi];
      if (unit === 'char') {
        let at = 0;
        for (const g of graphemes(word.text)) {
          const b = rect(at, at + g.length);
          items.push({ text: g, em: word.em, x: b.left - natural.left, w: b.width, top: b.top, word: wi });
          at += g.length;
        }
      } else {
        const b = sp.getBoundingClientRect();
        items.push({ text: word.text, em: word.em, x: b.left - natural.left, w: b.width, top: b.top, word: wi });
      }
    });
    const merged = unit === 'line'
      ? [{ line: true, x: 0, w: naturalW, top: natural.top }]
      : items;
    // Emphasis geometry comes from the natural pass.
    const emRuns = [];
    spans.forEach((sp, wi) => {
      if (!row.words[wi].em) return;
      const b = sp.getBoundingClientRect();
      const lastRun = emRuns[emRuns.length - 1];
      if (lastRun && lastRun.end === wi - 1) { lastRun.right = b.right - natural.left; lastRun.end = wi; }
      else emRuns.push({ left: b.left - natural.left, right: b.right - natural.left, end: wi });
    });

    if (unit === 'line') {
      // Keep the natural inline run: exact shaping, one transform.
      const holder = document.createElement('span');
      holder.style.cssText = 'position:absolute;left:0;top:0;white-space:pre;will-change:transform';
      while (line.firstChild) holder.appendChild(line.firstChild);
      line.appendChild(holder);
      units.push({ el: holder, line: li, x: 0, w: naturalW, size: row.size, em: false });
    } else {
      line.textContent = '';
      for (const it of merged) {
        const el = document.createElement('span');
        el.style.cssText = `position:absolute;left:${it.x}px;top:0;white-space:pre;`;
        const inner = document.createElement('span');
        Object.assign(inner.style, fontCss(s, it.em, row.size));
        if (it.em && s.em?.color) inner.style.color = s.em.color;
        inner.textContent = it.text;
        el.appendChild(inner);
        if (mask === 'word') {
          const clip = document.createElement('span');
          clip.style.cssText = `position:absolute;left:${it.x}px;top:0;width:${it.w}px;height:${lh}px;clip-path:inset(-.22em -.12em -.3em -.12em)`;
          el.style.left = '0px';
          clip.appendChild(el);
          line.appendChild(clip);
        } else {
          line.appendChild(el);
        }
        // Correct baseline drift between mixed fonts.
        const dy = it.top - inner.getBoundingClientRect().top;
        if (Math.abs(dy) > 0.25) el.style.top = `${dy}px`;
        units.push({ el, line: li, x: it.x, w: it.w, size: row.size, em: it.em, word: it.word });
      }
    }
    line.style.left = `${left}px`;
    line.style.width = `${naturalW}px`;
    if (mask === 'line') line.style.clipPath = 'inset(-.2em -.6em -.28em -.6em)';
    lines.push({ el: line, y, h: lh, left, w: naturalW, size: row.size, words: row.words.map((w) => w.text), big: row.big });

    const style = layer.emphasis?.style;
    if (style === 'bar' || style === 'underline') {
      for (const run of emRuns) {
        const bar = document.createElement('div');
        const pad = style === 'bar' ? row.size * 0.06 : 0;
        const h = style === 'bar' ? lh * 0.98 : Math.max(4, row.size * 0.045);
        const top = style === 'bar' ? y + lh * 0.01 : y + lh - row.size * 0.06;
        bar.style.cssText = `position:absolute;left:${left + run.left - pad}px;top:${top}px;width:${run.right - run.left + pad * 2}px;height:${h}px;background:${layer.emphasis.color || 'currentColor'};transform-origin:0 50%;transform:scaleX(0)`;
        block.insertBefore(bar, block.firstChild);
        marks.push({ el: bar });
      }
    }
    y += lh;
  });
  block.style.height = `${y}px`;

  // Stagger order.
  const count = unit === 'line' ? lines.length : units.length;
  const order = units.map((_, i) => i);
  const kind = anim.order || 'forward';
  if (kind === 'reverse') order.reverse();
  if (kind === 'random') {
    const r = rng(layer.seed || 11);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  }
  const rank = new Array(units.length);
  order.forEach((u, i) => { rank[u] = i; });
  const speed = layer.speed || 1;
  const dur = (anim.dur ?? 0) / speed;
  const stagger = (anim.stagger ?? 0) / speed;
  const perWord = layer.perWord ? layer.perWord / speed : 0;
  // Reading-paced reveal: each line waits for the words before it.
  const delays = units.map((u, i) => {
    if (!perWord) return rank[i] * stagger;
    let words = 0;
    for (let l = 0; l < u.line; l++) words += lines[l].words.length;
    return words * perWord;
  });
  const ease = curve(anim.ease);
  const start = layer.start ?? 0;
  const inEnd = start + Math.max(0, ...delays) + dur;
  const exitDur = exit ? (exit.dur ?? 0.5) / speed : 0;
  const exitStag = exit ? (exit.stagger ?? 0) / speed : 0;
  const exitSpan = exit ? exitDur + exitStag * Math.max(0, lines.length - 1) : 0;
  const exitEase = exit ? curve(exit.ease) : null;

  const apply = (u, i, pin, pout) => {
    const from = anim.from || {}, to = exit?.to || {};
    const e = 1 - pin; // remaining entrance
    const lineW = lines[u.line].w;
    const sign = (anim.alternate && u.line % 2 ? -1 : 1);
    const signOut = (exit?.alternate && u.line % 2 ? -1 : 1);
    const em = u.size;
    let x = (from.x || 0) * em * e + (from.xw || 0) * sign * lineW * e;
    let y2 = (from.y || 0) * em * e;
    if (from.spread) x += (u.x + u.w / 2 - lineW / 2) * from.spread * e;
    x += (to.x || 0) * em * pout + (to.xw || 0) * signOut * lineW * pout;
    y2 += (to.y || 0) * em * pout;
    const scale = lerp(from.scale ?? 1, 1, pin) * lerp(1, to.scale ?? 1, pout);
    const rot = (from.rotate || 0) * e + (to.rotate || 0) * pout;
    const rotX = (from.rotateX || 0) * e;
    const op = lerp(from.opacity ?? 1, 1, clamp(pin)) * lerp(1, to.opacity ?? 1, clamp(pout));
    const blur = (from.blur || 0) * em * Math.max(0, e) + (to.blur || 0) * em * pout;
    const t = [];
    if (rotX) t.push('perspective(900px)');
    t.push(`translate3d(${x.toFixed(2)}px,${y2.toFixed(2)}px,0)`);
    if (rotX) t.push(`rotateX(${rotX.toFixed(2)}deg)`);
    if (rot) t.push(`rotate(${(rot * (rank[i] % 2 ? -1 : 1)).toFixed(2)}deg)`);
    if (scale !== 1) t.push(`scale(${scale.toFixed(4)})`);
    u.el.style.transform = t.join(' ');
    u.el.style.transformOrigin = '50% 60%';
    u.el.style.opacity = op.toFixed(3);
    u.el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  };

  const emphasis = layer.emphasis;
  const seek = (t, { still = false, end = Infinity } = {}) => {
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (still) { apply(u, i, 1, 0); continue; }
      const raw = dur > 0 ? clamp((t - start - delays[i]) / dur) : t >= start + delays[i] ? 1 : 0;
      let pout = 0;
      if (exit) {
        const lineRank = u.line;
        const os = end - exitSpan + lineRank * exitStag;
        pout = exitEase(clamp((t - os) / exitDur));
      }
      apply(u, i, ease(raw), pout);
    }
    if (marks.length) {
      const at = start + (emphasis.at ?? inEnd - start);
      const p = still ? 1 : curve(emphasis.ease || 'in-out-strong')(clamp((t - at) / (emphasis.dur ?? 0.5)));
      for (const mk of marks) mk.el.style.transform = `scaleX(${p.toFixed(4)})`;
    }
  };

  // When the first words become readable, used by the hook checks.
  const firstRead = start + Math.min(...delays) + dur * 0.55;
  return { block, lines, units, seek, height: y, inEnd, exitSpan, count, firstRead };
}
