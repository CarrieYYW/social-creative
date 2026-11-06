// Timeline engine. Everything visible is a function of time: seek(t) gives the same pixels in preview and export.
import { curve, clamp, lerp, rng } from './easing.js';
import { buildText } from './text.js';
import { createTransition } from './transitions.js';
import { contextFor } from './schema.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function ensureFonts(brand, root = document) {
  const faces = (brand.fonts || []).map((f) => {
    const face = new FontFace(f.family, `url("${f.src.startsWith('http') || f.src.startsWith('/') ? f.src : `/project/${f.src}`}")`, {
      weight: String(f.weight ?? '100 900'), style: f.style || 'normal', stretch: f.stretch || 'normal',
    });
    root.fonts.add(face);
    return face.load().catch(() => null);
  });
  return Promise.all(faces);
}

// A family is present if text measures differently from both generic fallbacks.
export function fontAvailable(family) {
  const ctx = document.createElement('canvas').getContext('2d');
  const width = (f) => { ctx.font = `100px ${f}`; return ctx.measureText('mmmmmmmmmmlli QgW').width; };
  return width(`"${family}",monospace`) !== width('monospace') || width(`"${family}",serif`) !== width('serif');
}

const asset = (src) => (!src ? '' : /^(https?:|data:|\/)/.test(src) ? src : `/project/${src}`);

function tweenValues(tweens = [], t, still) {
  const out = {};
  for (const w of tweens) {
    const dur = w.dur ?? 1;
    const p = still ? (w.rest ?? 1) : curve(w.ease || 'linear')(clamp((t - (w.start ?? 0)) / dur));
    out[w.prop] = lerp(w.from, w.to, p);
  }
  return out;
}

function applyBox(el, box = {}) {
  el.style.position = 'absolute';
  el.style.left = `${box.x ?? 0}px`;
  el.style.top = `${box.y ?? 0}px`;
  if (box.w !== undefined) el.style.width = `${box.w}px`;
  if (box.h !== undefined) el.style.height = `${box.h}px`;
}

function transformOf(v) {
  const t = [];
  if (v.x !== undefined || v.y !== undefined) t.push(`translate3d(${(v.x ?? 0).toFixed(2)}px,${(v.y ?? 0).toFixed(2)}px,0)`);
  if (v.rotate !== undefined) t.push(`rotate(${v.rotate.toFixed(3)}deg)`);
  if (v.scale !== undefined) t.push(`scale(${v.scale.toFixed(5)})`);
  if (v.scaleX !== undefined) t.push(`scaleX(${v.scaleX.toFixed(5)})`);
  if (v.scaleY !== undefined) t.push(`scaleY(${v.scaleY.toFixed(5)})`);
  return t.join(' ');
}

function revealClip(type, p) {
  const r = ((1 - p) * 100).toFixed(3);
  switch (type) {
    case 'up': return `inset(${r}% 0 0 0)`;
    case 'down': return `inset(0 0 ${r}% 0)`;
    case 'left': return `inset(0 ${r}% 0 0)`;
    case 'right': return `inset(0 0 0 ${r}%)`;
    case 'center': return `inset(${(r / 2).toFixed(3)}% 0 ${(r / 2).toFixed(3)}% 0)`;
    default: return 'none';
  }
}

// Inline SVG arrives as text, so it is parsed as XML and stripped of anything executable.
function safeSvg(markup) {
  const doc = new DOMParser().parseFromString(String(markup), 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg') return document.createElementNS(SVG_NS, 'svg');
  root.querySelectorAll('script,foreignObject').forEach((n) => n.remove());
  for (const el of [root, ...root.querySelectorAll('*')]) {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
    }
  }
  return document.importNode(root, true);
}

class Studio {
  constructor(stage, project, template, media, opts) {
    this.stage = stage;
    this.project = project;
    this.template = template;
    this.media = media || {};
    this.mode = opts.mode || 'video';
    this.ctx = contextFor(project, template, { mode: this.mode, format: opts.format });
    this.timeline = template.build(this.ctx);
    this.fps = project.fps;
    this.step = this.timeline.step || 1;
    this.pending = [];
    this.layout();
  }

  layout() {
    const { w, h } = this.ctx.format;
    const tl = this.timeline;
    const stage = this.stage;
    stage.replaceChildren();
    Object.assign(stage.style, { position: 'relative', width: `${w}px`, height: `${h}px`, overflow: 'hidden', background: tl.background || '#000' });
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    const defs = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defs);
    stage.appendChild(svg);

    let clock = 0;
    this.scenes = tl.scenes.map((s, i) => {
      const el = document.createElement('div');
      el.className = 'scene';
      el.style.cssText = `position:absolute;inset:0;overflow:hidden;background:${s.background || 'transparent'};visibility:hidden`;
      stage.appendChild(el);
      const transition = i && s.transition ? createTransition(s.transition, { W: w, H: h, defs, seed: this.ctx.seed + i }) : null;
      const overlap = transition ? transition.options.dur : 0;
      const start = i ? clock - overlap : 0;
      const scene = { ...s, index: i, el, start, duration: s.duration, end: start + s.duration, transition, overlap, layers: [] };
      clock = scene.end;
      const refs = new Map();
      for (const l of s.layers || []) {
        const layer = this.makeLayer(l, el, refs, s.duration);
        scene.layers.push(layer);
        if (l.id) refs.set(l.id, layer);
      }
      return scene;
    });
    this.duration = tl.duration ?? clock;
    this.overlays = [];
    const overlayRoot = document.createElement('div');
    overlayRoot.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    stage.appendChild(overlayRoot);
    const refs = new Map();
    for (const l of tl.overlays || []) {
      const layer = this.makeLayer(l, overlayRoot, refs, this.duration);
      this.overlays.push(layer);
      if (l.id) refs.set(l.id, layer);
    }
    this.buildFinish(tl.finish || {});
  }

  buildFinish(f) {
    const { w, h } = this.ctx.format;
    this.grain = null;
    if (f.vignette) {
      const v = document.createElement('div');
      v.style.cssText = `position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 50% 50%,transparent 55%,rgba(0,0,0,${f.vignette}) 100%)`;
      this.stage.appendChild(v);
    }
    if (f.grain) {
      const tile = 320;
      const random = rng(this.ctx.seed * 31 + 5);
      const c = document.createElement('canvas');
      c.width = c.height = tile;
      const g = c.getContext('2d');
      const img = g.createImageData(tile, tile);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = 128 + (random() + random() + random() - 1.5) * 118;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:${f.grain};background-image:url(${c.toDataURL('image/png')});background-size:${tile}px ${tile}px`;
      this.stage.appendChild(el);
      this.grain = { el, w, h };
    }
  }

  makeLayer(l, parent, refs, sceneDuration) {
    const start = l.start ?? 0;
    const end = l.end ?? sceneDuration;
    const layer = { spec: l, start, end, kind: l.kind, id: l.id };
    const wrap = document.createElement('div');
    wrap.className = `layer layer-${l.kind}`;
    wrap.dataset.id = l.id || '';
    layer.el = wrap;
    parent.appendChild(wrap);
    if (l.blend) wrap.style.mixBlendMode = l.blend;
    if (l.z !== undefined) wrap.style.zIndex = l.z;
    if (l.origin) wrap.style.transformOrigin = l.origin;

    if (l.kind === 'text') {
      const box = this.resolveBox(l, refs);
      applyBox(wrap, { x: box.x, y: 0, w: box.w });
      const built = buildText(wrap, { ...l, box, start: 0 });
      layer.text = built;
      const anchorY = this.anchorY(l, box, built.height, refs);
      wrap.style.top = `${anchorY}px`;
      wrap.style.height = `${built.height}px`;
      layer.bounds = { x: box.x, y: anchorY, w: box.w, h: built.height };
      layer.seek = (t, still) => built.seek(t, { still, end: end - start });
    } else if (l.kind === 'image' || l.kind === 'video') {
      applyBox(wrap, l.box || { x: 0, y: 0, w: this.ctx.format.w, h: this.ctx.format.h });
      wrap.style.overflow = 'hidden';
      const img = document.createElement('img');
      img.alt = '';
      const fx = (l.focus?.x ?? 0.5) * 100, fy = (l.focus?.y ?? 0.5) * 100;
      img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:${l.fit || 'cover'};object-position:${fx}% ${fy}%;transform-origin:${fx}% ${fy}%`;
      if (l.filter) img.style.filter = l.filter;
      wrap.appendChild(img);
      layer.img = img;
      if (l.kind === 'image') {
        img.src = asset(l.src);
        this.pending.push(img.decode().catch(() => { layer.broken = true; }));
      } else {
        layer.frames = this.media[l.src];
        if (!layer.frames) layer.broken = true;
      }
      layer.bounds = l.box;
    } else if (l.kind === 'rect') {
      const box = this.resolveBox(l, refs);
      box.y = this.anchorY(l, box, box.h, refs);
      applyBox(wrap, box);
      wrap.style.background = l.fill || 'transparent';
      if (l.radius) wrap.style.borderRadius = `${l.radius}px`;
      layer.bounds = box;
    } else if (l.kind === 'svg') {
      applyBox(wrap, l.box);
      wrap.appendChild(safeSvg(l.markup));
      layer.bounds = l.box;
    } else if (l.kind === 'group') {
      applyBox(wrap, l.box || { x: 0, y: 0, w: this.ctx.format.w, h: this.ctx.format.h });
      if (l.clip) wrap.style.clipPath = l.clip;
      const childRefs = new Map();
      layer.children = (l.layers || []).map((c) => {
        const child = this.makeLayer(c, wrap, childRefs, sceneDuration);
        if (c.id) childRefs.set(c.id, child);
        return child;
      });
    } else if (l.kind === 'counter') {
      const box = this.resolveBox(l, refs);
      const format = (n) => `${l.prefix || ''}${n.toLocaleString('en-US', { minimumFractionDigits: l.decimals || 0, maximumFractionDigits: l.decimals || 0 })}${l.suffix || ''}`;
      const f = l.font;
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;left:0;top:0;white-space:pre;line-height:1;color:${l.color};font-family:"${f.family}",${f.fallback || 'serif'};font-weight:${f.weight ?? 400};letter-spacing:${f.tracking ?? 0}em;font-variant-numeric:tabular-nums lining-nums;font-size:100px`;
      el.textContent = format(l.to);
      wrap.appendChild(el);
      const size = Math.min(f.maxSize ?? 400, (box.w / el.getBoundingClientRect().width) * 100);
      el.style.fontSize = `${size}px`;
      applyBox(wrap, { x: box.x, y: box.y, w: box.w, h: size });
      layer.bounds = { x: box.x, y: box.y, w: box.w, h: size };
      const ease = curve(l.ease || 'out-expo');
      layer.seek = (t, still) => {
        // Whole frames only, so motion-blur sub-frames do not ghost one digit over another.
        const whole = Math.floor(t * this.fps + 1e-6) / this.fps;
        const p = still ? 1 : ease(clamp(whole / (l.dur ?? 1)));
        const value = lerp(l.from ?? 0, l.to, p);
        el.textContent = format(l.decimals ? value : Math.round(value));
      };
    } else if (l.kind === 'captions') {
      this.makeCaptions(layer, l, wrap);
    } else {
      throw new Error(`Unknown layer kind "${l.kind}"`);
    }
    return layer;
  }

  resolveBox(l, refs) {
    const box = { ...(l.box || {}) };
    const ref = l.below ? refs.get(l.below.id) : l.above ? refs.get(l.above.id) : null;
    if (ref?.bounds) {
      box.x ??= ref.bounds.x;
      box.w ??= ref.bounds.w;
    }
    return box;
  }

  anchorY(l, box, height, refs) {
    if (l.below) {
      const r = refs.get(l.below.id);
      if (r?.bounds) return r.bounds.y + r.bounds.h + (l.below.gap ?? 0);
    }
    if (l.above) {
      const r = refs.get(l.above.id);
      if (r?.bounds) return r.bounds.y - height - (l.above.gap ?? 0);
    }
    // Centre on the frame when that stays inside the safe box; a safe area is rarely symmetrical.
    if (l.valign === 'centre') {
      const y = (this.ctx.format.h - height) / 2;
      return clamp(y, box.y, Math.max(box.y, box.y + (box.h ?? 0) - height));
    }
    if (l.valign === 'middle') return box.y + ((box.h ?? 0) - height) / 2;
    if (l.valign === 'bottom') return box.y + (box.h ?? 0) - height;
    return box.y ?? 0;
  }

  // Captions: phrase pages from word timings, with the spoken word marked.
  makeCaptions(layer, l, wrap) {
    const pages = [];
    let page = [];
    const flush = () => { if (page.length) pages.push(page); page = []; };
    for (const w of l.words || []) {
      const chars = page.map((x) => x.w).join(' ').length + w.w.length + 1;
      const gap = page.length ? w.s - page[page.length - 1].e : 0;
      if (page.length && (chars > (l.maxChars ?? 30) || gap > 0.35)) flush();
      page.push(w);
      if (/[.!?]$/.test(w.w)) flush();
    }
    flush();
    layer.pages = pages.map((words, i) => {
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;inset:0';
      wrap.appendChild(el);
      const lineText = words.map((w) => w.w).join(' ');
      const built = buildText(el, {
        text: lineText, font: { ...l.font }, box: l.box, color: l.color,
        in: { preset: 'none', unit: 'word' },
      });
      const y = l.box.y + (l.box.h - built.height) / (l.valign === 'bottom' ? 1 : 2);
      built.block.style.top = `${y}px`;
      built.block.style.left = `${l.box.x}px`;
      if (l.plate) {
        // One plate per line, hugging the words.
        const pad = (l.font.size ?? 60) * 0.26;
        for (const line of built.lines) {
          const plate = document.createElement('div');
          plate.style.cssText = `position:absolute;left:${l.box.x + line.left - pad}px;top:${y + line.y - pad * 0.1}px;width:${line.w + pad * 2}px;height:${line.h + pad * 0.2}px;background:${l.plate};border-radius:${pad * 0.5}px`;
          el.insertBefore(plate, built.block);
        }
      }
      const next = pages[i + 1];
      const end = next ? Math.min(next[0].s, Math.max(words[words.length - 1].e + 0.15, words[0].s + 5 / 6)) : words[words.length - 1].e + 0.3;
      return { el, built, words, start: words[0].s, end };
    });
    applyBox(wrap, { x: 0, y: 0, w: this.ctx.format.w, h: this.ctx.format.h });
    layer.seek = (t, still) => {
      for (const p of layer.pages) {
        const on = still ? p === layer.pages[0] : t >= p.start && t < p.end;
        p.el.style.display = on ? 'block' : 'none';
        if (!on) continue;
        p.built.units.forEach((u, i) => {
          const w = p.words[i];
          const active = w && t >= w.s && t < w.e;
          u.el.style.color = active ? l.activeColor || l.color : l.color;
          u.el.style.transform = 'none';
          u.el.style.opacity = '1';
        });
      }
    };
  }

  seekLayer(layer, t, still) {
    const l = layer.spec;
    const visible = still ? l.still !== false : t >= layer.start && t < layer.end;
    layer.el.style.display = visible ? '' : 'none';
    if (!visible) return;
    const local = t - layer.start;
    const v = tweenValues(l.tween, local, still);
    const hasOpacity = v.opacity !== undefined;
    const tr = transformOf(v);
    if (l.kind === 'image' || l.kind === 'video') {
      layer.img.style.transform = tr;
      if (hasOpacity) layer.el.style.opacity = v.opacity.toFixed(3);
      else if (l.opacity !== undefined) layer.el.style.opacity = l.opacity;
    } else {
      layer.el.style.transform = tr;
      if (hasOpacity) layer.el.style.opacity = v.opacity.toFixed(3);
      else if (l.opacity !== undefined) layer.el.style.opacity = l.opacity;
    }
    if (l.reveal) {
      const r = l.reveal;
      const p = still ? 1 : curve(r.ease || 'in-out-strong')(clamp((local - (r.start ?? 0)) / (r.dur ?? 1)));
      layer.el.style.clipPath = p >= 1 ? 'none' : revealClip(r.type, p);
    }
    if (l.kind === 'video' && layer.frames) {
      const f = clamp(Math.floor(((l.in ?? 0) + local * (l.speed ?? 1)) * layer.frames.fps), 0, layer.frames.count - 1);
      const url = `${layer.frames.base}/${String(f + 1).padStart(6, '0')}.jpg`;
      if (layer.currentFrame !== url) {
        layer.currentFrame = url;
        layer.img.src = url;
        this.pending.push(layer.img.decode().catch(() => {}));
      }
    }
    if (layer.seek) layer.seek(local, still);
    if (layer.children) for (const c of layer.children) this.seekLayer(c, local, still);
  }

  // Returns once images for this frame are decoded.
  async seek(time, { still = false, scene: sceneIndex } = {}) {
    let t = time;
    if (this.step > 1) t = Math.floor(t * this.fps / this.step) * this.step / this.fps;
    t = clamp(t, 0, this.duration - 1e-4);
    this.time = t;
    const scenes = this.scenes;
    for (const s of scenes) s.el.style.visibility = 'hidden';
    // Clear all scene effects before applying an active transition: a later reset
    // must not erase the incoming scene of an earlier transition.
    for (const s of scenes) if (s.transition) s.transition.reset(scenes[s.index - 1].el, s.el);
    if (still) {
      const s = scenes[sceneIndex ?? this.timeline.stillScene ?? 0];
      s.el.style.visibility = 'visible';
      for (const l of s.layers) this.seekLayer(l, 0, true);
    } else {
      const active = scenes.filter((s) => t >= s.start && t < s.end + (scenes[s.index + 1]?.overlap ?? 0) * 0);
      for (const s of active) {
        s.el.style.visibility = 'visible';
        for (const l of s.layers) this.seekLayer(l, t - s.start, false);
      }
      for (const s of scenes) {
        if (!s.transition) continue;
        const prev = scenes[s.index - 1];
        if (t >= s.start && t < s.start + s.overlap) s.transition.apply(prev.el, s.el, (t - s.start) / s.overlap);
      }
    }
    for (const l of this.overlays) this.seekLayer(l, t, still);
    if (this.grain) {
      const f = Math.round(t * this.fps);
      const r = rng(f * 2654435761 + 17);
      this.grain.el.style.backgroundPosition = still ? '0 0' : `${Math.floor(r() * 320)}px ${Math.floor(r() * 320)}px`;
    }
    const pending = this.pending;
    this.pending = [];
    if (pending.length) await Promise.all(pending);
  }

  textLayers() {
    const out = [];
    const walk = (layers, scene) => {
      for (const l of layers) {
        if (l.kind === 'text') out.push({ layer: l, scene });
        if (l.children) walk(l.children, scene);
      }
    };
    for (const s of this.scenes) walk(s.layers, s);
    walk(this.overlays, null);
    return out;
  }
}

export async function mountStudio(stage, project, template, media, opts = {}) {
  await ensureFonts(project.brand || {});
  await document.fonts.ready;
  if (opts.isCurrent && !opts.isCurrent()) return null;
  const studio = new Studio(stage, project, template, media, opts);
  const pending = studio.pending;
  studio.pending = [];
  await Promise.all(pending);
  return studio;
}
