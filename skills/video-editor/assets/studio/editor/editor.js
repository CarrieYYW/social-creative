// Visual editor. Reads and writes project.json, so edits made here and edits made in chat stay in one place.
import { defaultsOf, checkValue, resolveFormat, FORMATS } from '/runtime/schema.js';
import { recordDefaults } from '/runtime/records.js';
import { createSaveQueue, pollSavedProject } from './save-queue.js';

const $ = (id) => document.getElementById(id);
const state = { project: null, template: null, revision: null, dirty: false, undo: [], redo: [], time: 0, duration: 1, playing: false, seeking: false, still: false, loadToken: 0, lastExport: null, editGeneration: 0, conflict: null };
const frame = $('stage');
let api = null;

const status = (text) => { $('status').textContent = text; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const clone = (x) => structuredClone(x);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
  }
  n.append(...kids.filter((k) => k !== null && k !== undefined));
  return n;
};

async function boot() {
  await new Promise((resolve) => { const c = () => (frame.contentWindow?.stageReady ? resolve() : setTimeout(c, 30)); c(); });
  api = frame.contentWindow.stageApi;
  const res = await (await fetch('/api/project')).json();
  state.project = res.project;
  state.revision = res.revision;
  state.template = await import(`/template.js?id=${encodeURIComponent(state.project.template)}`);
  $('template-name').textContent = state.template.meta.name;
  for (const f of state.template.meta.formats) $('format').append(el('option', { value: f }, FORMATS[f].name));
  $('format').value = state.project.format;
  renderControls();
  renderStory();
  await reload();
  refreshExports();
  setInterval(pollProject, 1000);
  status('Ready');
}

async function reload() {
  const token = ++state.loadToken;
  try {
    const info = await api.load(state.project, { mode: state.still ? 'still' : 'video' });
    if (token !== state.loadToken || !info) return;
    state.duration = info.duration;
    fit(info.w, info.h);
    drawMarks(info);
    await show(Math.min(state.time, info.duration));
    renderChecks(api.lint());
  } catch (error) {
    if (token === state.loadToken) status(`Preview error: ${error.message}`);
  }
}
const reloadSoon = debounce(reload, 90);

function fit(w, h) {
  const box = $('viewport').getBoundingClientRect();
  const scale = Math.min(box.width / w, box.height / h);
  frame.width = w; frame.height = h;
  frame.style.width = `${w}px`; frame.style.height = `${h}px`;
  frame.style.transform = `scale(${scale})`;
  const shell = $('frame');
  shell.style.width = `${w * scale}px`; shell.style.height = `${h * scale}px`;
  const s = resolveFormat(state.project.format, state.project).safe;
  Object.assign($('safe').style, { left: `${s.left * scale}px`, top: `${s.top * scale}px`, right: `${s.right * scale}px`, bottom: `${s.bottom * scale}px` });
}
new ResizeObserver(() => { if (api?.studio) { const f = api.studio.ctx.format; fit(f.w, f.h); } }).observe($('viewport'));

function drawMarks(info) {
  $('marks').replaceChildren(...info.scenes.slice(1).map((s) => {
    const i = el('i');
    i.style.left = `${(s.start / info.duration) * 100}%`;
    return i;
  }));
}

async function show(t) {
  state.time = t;
  if (state.seeking) return;
  state.seeking = true;
  try {
    await api.seek(t, { still: state.still });
  } finally {
    state.seeking = false;
  }
  $('time').value = String(t / state.duration);
  $('clock').textContent = `${t.toFixed(2)} / ${state.duration.toFixed(1)} s`;
}

function play(on) {
  state.playing = on;
  $('play').textContent = on ? 'Pause' : 'Play';
  $('play').setAttribute('aria-label', on ? 'Pause' : 'Play');
  const audio = $('audio');
  if (!on) { audio.pause(); return; }
  if (state.time >= state.duration - 0.05) state.time = 0;
  const started = performance.now() - state.time * 1000;
  if ($('sound-on').checked && audio.src) { audio.currentTime = state.time; audio.play().catch(() => {}); }
  const tick = () => {
    if (!state.playing) return;
    const t = (performance.now() - started) / 1000;
    if (t >= state.duration) { show(state.duration - 0.001); play(false); return; }
    show(t);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Every change goes through here: history, autosave, preview.
function change(mutate, { rebuild = false } = {}) {
  state.undo.push(clone(state.project));
  if (state.undo.length > 120) state.undo.shift();
  state.redo = [];
  mutate(state.project);
  afterChange(rebuild);
}
function afterChange(rebuild) {
  state.editGeneration++;
  state.dirty = true;
  status(state.conflict ? 'Changes kept locally. Resolve the saved-version conflict above.' : 'Saving');
  saveSoon();
  reloadSoon();
  syncHistory();
  if (rebuild) { renderControls(); renderStory(); }
}
function syncHistory() { $('undo').disabled = !state.undo.length; $('redo').disabled = !state.redo.length; }

const saveSoon = debounce(save, 300);
const saveQueued = createSaveQueue({
  snapshot: () => state.dirty && !state.conflict ? { project: clone(state.project), base: state.revision, generation: state.editGeneration } : null,
  write: async ({ project, base }) => {
    const res = await fetch('/api/project', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project, base }) });
    const body = await res.json();
    return res.status === 409 ? { ...body, conflict: true } : !res.ok ? { error: body.error || 'Save failed.' } : body;
  },
  onSaved: (body, request) => {
    state.revision = body.revision;
    state.dirty = request.generation !== state.editGeneration;
    status(state.dirty ? 'Saving newer changes' : 'Saved');
    return state.dirty;
  },
  onConflict: (body) => {
    state.conflict = body;
    state.dirty = true;
    $('save-conflict').hidden = false;
    status('Changed elsewhere. Your edits are kept here; choose which version to use.');
  },
  onError: (error) => { status(`Not saved: ${error.message}`); },
});
function save() {
  if (state.conflict) return Promise.resolve(false);
  return state.dirty ? saveQueued() : Promise.resolve(true);
}
$('keep-edits').addEventListener('click', () => {
  if (!state.conflict) return;
  state.revision = state.conflict.revision;
  state.conflict = null;
  $('save-conflict').hidden = true;
  save();
});
$('load-saved').addEventListener('click', async () => {
  $('load-saved').disabled = $('keep-edits').disabled = true;
  try {
    const response = await fetch('/api/project');
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Could not load the saved project.');
    state.undo.push(clone(state.project));
    adopt(body);
    status('Loaded the saved version. Your previous edits are in Undo.');
  } catch (error) { status(error.message); }
  finally { $('load-saved').disabled = $('keep-edits').disabled = false; }
});

function adopt({ project, revision }) {
  state.editGeneration++;
  state.conflict = null;
  $('save-conflict').hidden = true;
  state.project = project;
  state.revision = revision;
  state.dirty = false;
  $('format').value = project.format;
  renderControls();
  renderStory();
  reload();
  syncHistory();
}

async function pollProject() {
  await pollSavedProject({
    state,
    isHidden: () => document.hidden,
    read: async () => {
      const response = await fetch('/api/project');
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Project refresh failed.');
      return body;
    },
    adopt: (body) => { adopt(body); status('Updated from project.json'); },
    onError: (error) => { status(`Could not refresh project: ${error.message}. Current edits are kept.`); },
  });
}

function field(c, value, onChange) {
  const id = `f-${c.id}-${Math.random().toString(36).slice(2, 7)}`;
  const top = el('label', { for: id }, el('span', {}, c.label || c.id));
  const error = el('div', { class: 'error', role: 'alert' });
  const commit = (v) => {
    const problem = checkValue(c, v);
    error.textContent = problem ? problem.replace(`${c.id}: `, '') : '';
    if (!problem) onChange(v);
  };
  let input;
  switch (c.type) {
    case 'text':
      input = el('textarea', { id, oninput: (e) => commit(e.target.value) });
      input.value = value ?? '';
      break;
    case 'line': case 'font':
      input = el('input', { id, type: 'text', list: c.type === 'font' ? 'fonts' : undefined, oninput: (e) => commit(e.target.value) });
      input.value = value ?? '';
      break;
    case 'number': {
      const range = el('input', { id, type: 'range', min: c.min, max: c.max, step: c.step ?? 'any' });
      const box = el('input', { type: 'number', min: c.min, max: c.max, step: c.step ?? 'any', 'aria-label': `${c.label} value` });
      range.value = value; box.value = value;
      range.addEventListener('input', () => { box.value = range.value; commit(Number(range.value)); });
      box.addEventListener('input', () => { if (box.value !== '') { range.value = box.value; commit(Number(box.value)); } });
      input = el('div', { class: 'row' }, range, box);
      break;
    }
    case 'select':
      input = el('select', { id, onchange: (e) => commit(e.target.value) }, ...c.options.map((o) => el('option', { value: o.value ?? o }, o.label ?? o)));
      input.value = value;
      break;
    case 'color':
      input = el('input', { id, type: 'color', oninput: (e) => commit(e.target.value) });
      input.value = value || '#000000';
      break;
    case 'toggle':
      input = el('input', { id, type: 'checkbox', onchange: (e) => commit(e.target.checked) });
      input.checked = !!value;
      break;
    case 'asset':
      input = assetPicker(id, c, value, commit);
      break;
    case 'list':
      input = listEditor(c, value, commit);
      break;
    default:
      input = el('span', {}, String(value));
  }
  const parts = [top, input];
  if (c.help) parts.push(el('div', { class: 'hint' }, c.help));
  parts.push(error);
  return el('div', { class: 'field' }, ...parts);
}

function assetPicker(id, c, value, commit) {
  const select = el('select', { id, onchange: (e) => commit(e.target.value) }, el('option', { value: '' }, 'None'));
  const fill = async (current) => {
    const { files } = await (await fetch('/api/assets')).json();
    select.replaceChildren(el('option', { value: '' }, 'None'), ...files.map((f) => el('option', { value: f }, f.replace('assets/', ''))));
    select.value = current ?? '';
  };
  fill(value);
  const file = el('input', {
    type: 'file', 'aria-label': `Upload for ${c.label}`,
    accept: c.accept === 'image' ? 'image/*' : c.accept === 'video' ? 'video/*' : c.accept === 'audio' ? 'audio/*' : undefined,
    onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      status('Uploading');
      const res = await fetch(`/api/upload?name=${encodeURIComponent(f.name)}`, { method: 'POST', body: f });
      const body = await res.json();
      if (!res.ok) { status(body.error); return; }
      await fill(body.path);
      commit(body.path);
      status('Saved');
    },
  });
  return el('div', {}, select, file);
}

// Lists of short records get cards. Very long lists, such as word timings, stay as checked JSON.
function listEditor(c, value, commit) {
  const items = value || [];
  if (!Array.isArray(items) || items.some((item) => !item || typeof item !== 'object' || Array.isArray(item)) || items.length > 24 || !c.fields) return jsonEditor(items, commit);
  const wrap = el('div');
  const update = (next) => { commit(next); draw(next); };
  const draw = (list) => {
    wrap.replaceChildren(...list.map((item, i) => {
      // Show what this item uses; a blank field for every possible key is noise.
      const resolved = recordDefaults(c, item);
      const present = Object.keys(resolved);
      const keys = present.length ? present : c.fields || [];
      const card = el('div', { class: 'card' }, el('header', {},
        el('b', {}, `${i + 1}. ${item.role || item.src || ''}`),
        el('span', {},
          el('button', { type: 'button', 'aria-label': 'Move up', disabled: i === 0, onclick: () => { const n = clone(list); [n[i - 1], n[i]] = [n[i], n[i - 1]]; update(n); } }, '↑'),
          el('button', { type: 'button', 'aria-label': 'Move down', disabled: i === list.length - 1, onclick: () => { const n = clone(list); [n[i + 1], n[i]] = [n[i], n[i + 1]]; update(n); } }, '↓'),
          el('button', { type: 'button', 'aria-label': 'Remove', onclick: () => { const n = clone(list); n.splice(i, 1); update(n); } }, '×'))));
      for (const key of keys) {
        const v = resolved[key];
        const set = (next) => {
          const n = clone(list);
          n[i] = recordDefaults(c, { ...n[i], [key]: next });
          if (key === c.record?.kindField) update(n);
          else { commit(n); list = n; }
        };
        const choices = c.choices?.[key];
        if (choices) {
          const pick = el('select', { 'aria-label': key, onchange: (e) => set(e.target.value) }, ...choices.map((o) => el('option', { value: o }, o)));
          pick.value = v ?? choices[0];
          card.append(el('div', { class: 'field' }, el('label', {}, key), pick));
        } else if (typeof v === 'number' || c.record?.numbers?.includes(key)) {
          const box = el('input', { type: 'number', step: 'any', 'aria-label': key, oninput: (e) => { if (e.target.value !== '') set(Number(e.target.value)); } });
          box.value = v;
          card.append(el('div', { class: 'field' }, el('label', {}, key), box));
        } else if (typeof v === 'object' && v !== null) {
          card.append(el('div', { class: 'field' }, el('label', {}, key), jsonEditor(v, set)));
        } else {
          const multi = /\n/.test(v || '') || ['text', 'items', 'leftItems', 'rightItems', 'label'].includes(key);
          const input = el(multi ? 'textarea' : 'input', { 'aria-label': key, type: multi ? undefined : 'text', oninput: (e) => set(e.target.value) });
          input.value = v ?? '';
          card.append(el('div', { class: 'field' }, el('label', {}, key), input));
        }
      }
      return card;
    }), el('button', { type: 'button', onclick: () => update([...list, recordDefaults(c)]) }, 'Add'));
  };
  draw(items);
  return wrap;
}

function jsonEditor(value, commit) {
  const area = el('textarea', { spellcheck: 'false', 'aria-label': 'JSON' });
  area.value = JSON.stringify(value, null, 1);
  const message = el('div', { class: 'error' });
  area.addEventListener('input', () => {
    try { commit(JSON.parse(area.value)); message.textContent = ''; } catch { message.textContent = 'Not valid JSON yet. Nothing changed.'; }
  });
  return el('div', {}, area, message);
}

function renderControls() {
  const host = $('tab-controls');
  const open = new Set([...host.querySelectorAll('details[open]')].map((d) => d.dataset.group));
  const first = !host.children.length;
  const defaults = defaultsOf(state.template.controls);
  const values = { ...defaults, ...state.project.values };
  const groups = new Map();
  for (const c of state.template.controls) {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group).push(c);
  }
  const brandControls = [
    ['paper', 'Paper', 'color'], ['ink', 'Ink', 'color'], ['accent', 'Accent', 'color'], ['muted', 'Quiet text', 'color'],
    ['display', 'Display typeface', 'font'], ['text', 'Text typeface', 'font'],
  ].map(([id, label, type]) => ({ id, label, type }));
  const sections = [...groups].map(([name, list], i) => {
    const d = el('details', { 'data-group': name, open: first ? i < 2 : open.has(name) }, el('summary', {}, name));
    for (const c of list) {
      const f = field(c, values[c.id], (v) => change((p) => { p.values[c.id] = v; }));
      if (c.type === 'number' || c.type === 'select') {
        f.firstChild.append(el('button', { class: 'reset', type: 'button', onclick: () => change((p) => { p.values[c.id] = clone(defaults[c.id]); }, { rebuild: true }) }, 'Reset'));
      }
      d.append(f);
    }
    return d;
  });
  const brand = el('details', { 'data-group': 'Brand', open: open.has('Brand') }, el('summary', {}, 'Brand'));
  for (const c of brandControls) brand.append(field(c, state.project.brand[c.id], (v) => change((p) => { p.brand[c.id] = v; })));
  const datalist = el('datalist', { id: 'fonts' }, ...['New York', 'Didot', 'Bodoni 72', 'Baskerville', 'Hoefler Text', 'Georgia', 'Palatino', 'Avenir Next', 'Avenir Next Condensed', 'Helvetica Neue', 'Futura', 'Gill Sans', 'Mona Sans'].map((f) => el('option', { value: f })));
  host.replaceChildren(...sections, brand, datalist);
}

function renderStory() {
  const s = state.project.story || {};
  const fields = [
    { id: 'audience', label: 'Who is this for?', type: 'line' },
    { id: 'takeaway', label: 'What should they remember?', type: 'line' },
    { id: 'hookType', label: 'Hook type', type: 'select', options: ['', 'result-first', 'contradiction', 'recognition', 'question', 'stakes', 'mid-action', 'image'] },
    { id: 'promise', label: 'Promise: what does the opening make them want to know?', type: 'text' },
    { id: 'payoff', label: 'Payoff: where is that answered?', type: 'text' },
    { id: 'shareReason', label: 'Share reason: what are they saying when they send it?', type: 'line' },
  ];
  const notes = (state.project.notes || []).map((n, i) => el('li', {},
    el('button', { type: 'button', onclick: () => { play(false); show(n.t); } }, `${n.t.toFixed(2)} s`), ' ', n.text,
    el('button', { class: 'reset', type: 'button', onclick: () => change((p) => { p.notes.splice(i, 1); }, { rebuild: true }) }, ' Remove')));
  $('tab-story').replaceChildren(
    el('p', { class: 'hint' }, 'Fill this in before polishing. It is what the template is for.'),
    ...fields.map((c) => field(c, s[c.id] ?? '', (v) => change((p) => { p.story = { ...(p.story || {}), [c.id]: v }; }))),
    el('h3', {}, 'Notes on this cut'),
    notes.length ? el('ul', { class: 'list' }, ...notes) : el('p', { class: 'hint' }, 'Pause on a moment and press Pin note here. Notes save to project.json with the time, so they can be acted on directly.'),
  );
}

function renderChecks(items) {
  const important = items.filter((i) => i.level !== 'info').length;
  $('check-count').textContent = important ? `(${important})` : '';
  $('checks').replaceChildren(...(items.length ? items : [{ level: 'ok', rule: 'clear', message: 'No findings.' }]).map((i) => el('li', { class: i.level }, i.message, el('small', {}, `${i.rule}${i.where ? ` · ${i.where}` : ''}`))));
}

async function refreshExports() {
  const { files } = await (await fetch('/api/exports')).json();
  $('exports').replaceChildren(...files.map((f) => el('li', {}, el('a', { href: `/project/exports/${f}`, target: '_blank', rel: 'noopener' }, f))));
}

async function render(draft) {
  if (state.dirty && !(await save())) return;
  const res = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft }) });
  const body = await res.json();
  if (!res.ok) { status(body.error); return; }
  selectTab('exports');
  $('job').hidden = false;
  $('draft').disabled = $('final').disabled = true;
  const timer = setInterval(async () => {
    const job = await (await fetch('/api/job')).json();
    $('job-bar').value = job.progress ?? 0;
    $('job-text').textContent = job.message || '';
    if (job.status !== 'running') {
      clearInterval(timer);
      $('draft').disabled = $('final').disabled = false;
      if (job.status === 'failed') $('job-text').textContent = `Failed: ${job.message}`;
      else { $('job').hidden = true; status('Render finished'); }
      refreshExports();
    }
  }, 500);
}

function selectTab(name) {
  for (const b of document.querySelectorAll('[data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === name));
  for (const t of document.querySelectorAll('.tab')) t.hidden = t.id !== `tab-${name}`;
}

for (const b of document.querySelectorAll('[data-tab]')) b.addEventListener('click', () => selectTab(b.dataset.tab));
$('play').addEventListener('click', () => play(!state.playing));
$('back').addEventListener('click', () => { play(false); show(Math.max(0, state.time - 1 / state.project.fps)); });
$('fwd').addEventListener('click', () => { play(false); show(Math.min(state.duration, state.time + 1 / state.project.fps)); });
$('time').addEventListener('input', (e) => { play(false); show(Number(e.target.value) * state.duration); });
$('safe-on').addEventListener('change', (e) => { $('safe').hidden = !e.target.checked; });
$('still-on').addEventListener('change', (e) => { state.still = e.target.checked; reload(); });
$('sound-on').addEventListener('change', async (e) => {
  if (!e.target.checked) return;
  status('Preparing sound');
  const res = await (await fetch('/api/audio-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
  if (res.path) { $('audio').src = `/project/${res.path}?t=${Date.now()}`; status('Sound ready'); } else status('This project has no sound yet');
});
$('format').addEventListener('change', (e) => change((p) => { p.format = e.target.value; }));
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
$('draft').addEventListener('click', () => render(true));
$('final').addEventListener('click', () => render(false));
$('full-check').addEventListener('click', async () => {
  if (state.dirty && !(await save())) return;
  status('Checking');
  const res = await (await fetch('/api/check', { method: 'POST' })).json();
  renderChecks(res.lint || []);
  status('Check finished');
});
$('note-add').addEventListener('click', () => {
  const box = el('input', { type: 'text', 'aria-label': 'Note text', placeholder: `Note at ${state.time.toFixed(2)} s, then press return` });
  const t = state.time;
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && box.value.trim()) { const text = box.value.trim(); box.remove(); change((p) => { p.notes = [...(p.notes || []), { t, text }]; }, { rebuild: true }); status('Note pinned'); }
    if (e.key === 'Escape') box.remove();
  });
  $('note-add').after(box);
  box.focus();
});
function undo() {
  if (!state.undo.length) return;
  state.redo.push(clone(state.project));
  state.project = state.undo.pop();
  afterChange(true);
}
function redo() {
  if (!state.redo.length) return;
  state.undo.push(clone(state.project));
  state.project = state.redo.pop();
  afterChange(true);
}
window.addEventListener('keydown', (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  if (e.code === 'Space' && !typing && document.activeElement?.tagName !== 'BUTTON') { e.preventDefault(); play(!state.playing); }
});
boot();
