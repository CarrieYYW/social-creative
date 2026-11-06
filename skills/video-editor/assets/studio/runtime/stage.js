// Runs identically inside the editor's iframe and the headless renderer.
import { mountStudio } from './engine.js';
import { lintStudio } from './lint.js';
import { validateProject } from './schema.js';
import { createLatestLoad } from './latest-load.js';

const stage = document.getElementById('stage');
const query = new URLSearchParams(location.search);
const proxy = query.get('proxy') === '1';
let templateCache = new Map();

async function loadTemplate(id) {
  if (!templateCache.has(id)) templateCache.set(id, await import(`/template.js?id=${encodeURIComponent(id)}`));
  return templateCache.get(id);
}

const load = createLatestLoad({
  prepare: async (project, options = {}) => {
    const template = await loadTemplate(project.template);
    const errors = validateProject({ ...project, format: options.format || project.format }, template);
    if (errors.length) throw new Error(errors.join('\n'));
    // The effective values include the selected variant, which can change footage.
    const response = await fetch(`/api/media?proxy=${proxy ? 1 : 0}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: project.values, fps: project.fps }) });
    const media = await response.json();
    if (!response.ok) throw new Error(media.error || 'Media preparation failed.');
    return { project, options, template, media };
  },
  mount: ({ project, options, template, media }, isCurrent) => mountStudio(stage, project, template, media, { ...options, isCurrent }),
  publish: (studio) => {
    window.stageApi.studio = studio;
    return { duration: studio.duration, fps: studio.fps, w: studio.ctx.format.w, h: studio.ctx.format.h, scenes: studio.scenes.map((s) => ({ start: s.start, end: s.end })) };
  },
});
window.stageApi = {
  studio: null,
  load,
  seek(t, opts) { return this.studio.seek(t, opts); },
  lint() { return lintStudio(this.studio); },
  cues() {
    const s = this.studio;
    return [...(s.timeline.cues || [])];
  },
  textBoxes() {
    return s_textBoxes(this.studio);
  },
  beats() {
    return s_beats(this.studio);
  },
  // Pixels of a screenshot region, used for contrast against what is really behind the text.
  async pixels(url, box) {
    const image = new Image();
    image.src = url;
    await image.decode();
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(box.w)); c.height = Math.max(1, Math.round(box.h));
    const g = c.getContext('2d');
    g.drawImage(image, -box.x, -box.y);
    return Array.from(g.getImageData(0, 0, c.width, c.height).data);
  },
  setTextVisible(on) {
    for (const { layer } of this.studio.textLayers()) layer.el.style.visibility = on ? '' : 'hidden';
  },
};

function s_textBoxes(studio) {
  return studio.textLayers().filter(({ layer }) => layer.bounds).map(({ layer, scene }) => ({
    id: layer.spec.id || 'text',
    scene: scene ? scene.index : null,
    start: (scene ? scene.start : 0) + layer.start,
    rest: (scene ? scene.start : 0) + Math.min(layer.start + layer.text.inEnd + 0.05, layer.end - 0.05),
    color: layer.spec.color,
    size: Math.min(...layer.text.lines.map((l) => l.size)),
    box: {
      x: layer.bounds.x + Math.min(...layer.text.lines.map((l) => l.left)),
      y: layer.bounds.y,
      w: Math.max(...layer.text.lines.map((l) => l.w)),
      h: layer.text.height,
    },
  }));
}

// One row per scene for the storyboard: when it runs, what it says, and when its text has settled.
function s_beats(studio) {
  const plain = (text) => String(text ?? '').replace(/\*/g, '').replace(/\s*\n\s*/g, ' ').trim();
  const texts = studio.textLayers();
  const captions = studio.overlays.find((l) => l.kind === 'captions')?.spec.words || [];
  return studio.scenes.map((s) => {
    const own = texts.filter(({ layer, scene }) => scene === s && layer.text && layer.spec.role !== 'label');
    const next = studio.scenes[s.index + 1];
    const last = s.end - (next?.overlap ?? 0) - 0.05;
    const settled = own.map(({ layer }) => s.start + Math.min(layer.start + layer.text.inEnd + 0.05, layer.end - 0.05));
    const at = settled.length ? Math.max(...settled) : s.start + s.duration * 0.6;
    const spoken = captions.filter((w) => w.s >= s.start && w.s < s.end).map((w) => w.w).join(' ');
    return {
      index: s.index,
      role: String(s.id ?? '').replace(/-\d+$/, ''),
      start: s.start,
      end: s.end,
      at: Math.max(s.start + 0.05, Math.min(at, last)),
      words: [...own.map(({ layer }) => plain(layer.spec.text)), plain(spoken)].filter(Boolean).join(' / '),
    };
  });
}
window.dispatchEvent(new Event('stage-ready'));
window.stageReady = true;
