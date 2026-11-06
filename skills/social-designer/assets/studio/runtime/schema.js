// Shared by Node and the browser. No DOM access here.
import { validateRecords } from './records.js';
// Safe areas are working defaults, not platform facts: see references/studio-system.md.
export const FORMATS = {
  reel: { name: 'Reel / Short / TikTok', w: 1080, h: 1920, safe: { top: 250, bottom: 480, left: 65, right: 130 } },
  story: { name: 'Story', w: 1080, h: 1920, safe: { top: 270, bottom: 380, left: 65, right: 65 } },
  post: { name: 'Portrait post 4:5', w: 1080, h: 1350, safe: { top: 84, bottom: 84, left: 84, right: 84 } },
  square: { name: 'Square 1:1', w: 1080, h: 1080, safe: { top: 84, bottom: 84, left: 84, right: 84 } },
  landscape: { name: 'Landscape 16:9', w: 1920, h: 1080, safe: { top: 70, bottom: 70, left: 96, right: 96 } },
};
// Meta's published Reels ad guidance: keep roughly 14% top, 35% bottom, 6% sides clear.
export const SAFE_PROFILES = { 'meta-ads': { top: 0.14, bottom: 0.35, left: 0.06, right: 0.06 } };

export const BRAND_DEFAULTS = {
  paper: '#F3EFE7', ink: '#161412', accent: '#B5492B', muted: '#6F6A62',
  display: 'New York', text: 'Helvetica Neue', fonts: [], logo: '', handle: '',
};

export function resolveFormat(name, project = {}) {
  const f = FORMATS[name];
  if (!f) throw new Error(`Unknown format "${name}". Use: ${Object.keys(FORMATS).join(', ')}`);
  let safe = { ...f.safe, ...(project.safe || {}) };
  const profile = project.safeProfile && SAFE_PROFILES[project.safeProfile];
  if (profile && (name === 'reel' || name === 'story')) {
    safe = { top: profile.top * f.h, bottom: profile.bottom * f.h, left: profile.left * f.w, right: profile.right * f.w };
  }
  return { id: name, ...f, safe };
}

export function defaultsOf(controls) {
  const out = {};
  for (const c of controls) if ('default' in c) out[c.id] = structuredClone(c.default);
  return out;
}

export function checkValue(c, v) {
  const fail = (m) => `${c.id}: ${m}`;
  switch (c.type) {
    case 'number':
      if (typeof v !== 'number' || !Number.isFinite(v)) return fail('must be a number');
      if (c.min !== undefined && v < c.min) return fail(`must be at least ${c.min}`);
      if (c.max !== undefined && v > c.max) return fail(`must be at most ${c.max}`);
      return null;
    case 'text': case 'line': case 'font': case 'asset':
      return typeof v === 'string' ? null : fail('must be text');
    case 'color':
      return /^#[0-9a-f]{6}$/i.test(v) || v === '' ? null : fail('must be a six-digit hex colour');
    case 'toggle':
      return typeof v === 'boolean' ? null : fail('must be true or false');
    case 'select':
      return c.options.some((o) => (o.value ?? o) === v) ? null : fail(`must be one of ${c.options.map((o) => o.value ?? o).join(', ')}`);
    case 'list':
      if (!Array.isArray(v)) return fail('must be a list');
      const recordError = validateRecords(c, v);
      return recordError ? fail(recordError) : null;
    default:
      return null;
  }
}

// Unknown ids are errors so a typo cannot silently do nothing.
export function validateProject(project, template) {
  const errors = [];
  if (!project || typeof project !== 'object') return ['Project must be a JSON object.'];
  if (project.studio !== 1) errors.push('studio: expected schema version 1.');
  if (!FORMATS[project.format]) errors.push(`format: unknown "${project.format}".`);
  if (!template.meta.formats.includes(project.format)) errors.push(`format: ${template.meta.id} does not support "${project.format}".`);
  if (![24, 25, 30, 60].includes(project.fps)) errors.push('fps: use 24, 25, 30 or 60.');
  const byId = new Map(template.controls.map((c) => [c.id, c]));
  for (const [k, v] of Object.entries(project.values || {})) {
    const c = byId.get(k);
    if (!c) { errors.push(`values.${k}: not a control of ${template.meta.id}.`); continue; }
    const e = checkValue(c, v);
    if (e) errors.push('values.' + e);
  }
  return errors;
}

export function newProject(template, format, overrides = {}) {
  return {
    studio: 1,
    template: template.meta.id,
    format: format || template.meta.formats[0],
    fps: 30,
    seed: 7,
    motionBlur: 0,
    brand: { ...BRAND_DEFAULTS },
    values: defaultsOf(template.controls),
    // Story comes first: a template is only the treatment of this.
    story: { audience: '', takeaway: '', hookType: '', promise: '', payoff: '', shareReason: '' },
    variants: [],
    audio: [],
    notes: [],
    ...overrides,
  };
}

export function contextFor(project, template, { mode = 'video', format } = {}) {
  return {
    mode,
    format: resolveFormat(format || project.format, project),
    fps: project.fps,
    seed: project.seed ?? 7,
    brand: { ...BRAND_DEFAULTS, ...(project.brand || {}) },
    v: { ...defaultsOf(template.controls), ...(project.values || {}) },
  };
}

// Words in a string once emphasis markers are removed.
export const wordCount = (s) => (String(s).replace(/\*/g, '').trim().match(/\S+/g) || []).length;

// Time to read: a fixed settling allowance plus words at a sustained on-screen rate.
// 2.5 words/s sits below the 160-180 wpm subtitle ceiling because display type is also being looked at.
export const readSeconds = (s, wps = 2.5) => Math.max(5 / 6, 0.5 + wordCount(s) / wps);
