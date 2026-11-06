import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { mountStudio } from '../runtime/engine.js';
import { lintStudio } from '../runtime/lint.js';
import { resolveFormat } from '../runtime/schema.js';
import { newProject, validateProject } from '../runtime/schema.js';
import { recordDefaults } from '../runtime/records.js';
import { createLatestLoad } from '../runtime/latest-load.js';
import { createSaveQueue, pollSavedProject } from '../editor/save-queue.js';
import { startServer, templatePath } from '../lib/server.mjs';
import { prepareMedia } from '../lib/media.mjs';
import * as talking from '../templates/talking-head.js';
import * as explainer from '../templates/explainer.js';

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const tick = () => new Promise((resolve) => setImmediate(resolve));
class Element {
  constructor() { this.style = {}; this.dataset = {}; this.children = []; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute() {}
  getBoundingClientRect() { return { width: 100 }; }
}
async function withDom(run) {
  const old = globalThis.document;
  globalThis.document = { createElement: () => new Element(), createElementNS: () => new Element(), fonts: { add() {}, ready: Promise.resolve() } };
  try { return await run(); } finally { globalThis.document = old; }
}

test('a later transition cannot clear the active incoming scene; seeks and stills reset deterministically', async () => withDom(async () => {
  const template = { controls: [], build: () => ({ scenes: [
    { duration: 2, layers: [] },
    { duration: 2, layers: [], transition: { type: 'push', dur: 0.7, dir: 'left' } },
    { duration: 2, layers: [], transition: { type: 'push', dur: 0.7, dir: 'left' } },
  ] }) };
  const studio = await mountStudio(new Element(), { brand: {}, format: 'reel', fps: 30 }, template, {});
  await studio.seek(1.65);
  const incoming = studio.scenes[1].el.style.transform;
  assert.ok(Math.abs(parseFloat(incoming.slice('translate3d('.length)) - 540) < 0.01);
  assert.ok(Math.abs(parseFloat(studio.scenes[0].el.style.transform.slice('translate3d('.length)) + 540) < 0.01);
  await studio.seek(2.25);
  assert.equal(studio.scenes[1].el.style.transform, '');
  await studio.seek(1.65);
  assert.equal(studio.scenes[1].el.style.transform, incoming);
  await studio.seek(0, { still: true, scene: 1 });
  assert.equal(studio.scenes[1].el.style.transform, '');
}));

test('a counter uses layer-local time once', async () => withDom(async () => {
  const template = { controls: [], build: () => ({ scenes: [{ duration: 4, layers: [{ kind: 'counter', from: 0, to: 100, start: 1, dur: 1, ease: 'linear', box: { x: 0, y: 0, w: 100 }, font: { family: 'sans', maxSize: 100 } }] }] }) };
  const studio = await mountStudio(new Element(), { brand: {}, format: 'reel', fps: 30 }, template, {});
  await studio.seek(1.5);
  assert.equal(studio.scenes[0].layers[0].el.children[0].textContent, '50');
  await studio.seek(2);
  assert.equal(studio.scenes[0].layers[0].el.children[0].textContent, '100');
}));

test('new timing records are numeric and malformed nested records fail before rendering', () => {
  const controls = Object.fromEntries(talking.controls.map((c) => [c.id, c]));
  const edit = recordDefaults(controls.edits);
  assert.deepEqual(edit, { in: 0, out: 1 });
  assert.equal(typeof recordDefaults(controls.words).s, 'number');
  assert.equal(typeof recordDefaults(controls.broll).dur, 'number');
  const p = newProject(talking);
  for (const patch of [
    { edits: [{ in: '2', out: '4' }] },
    { edits: [{ in: 2, out: 1 }] },
    { words: [{ w: 'hello', s: '2.1', e: '2.4' }] },
    { broll: [{ src: 'assets/a.mp4', at: 2, dur: 0 }] },
    { words: [null] },
  ]) assert.ok(validateProject({ ...p, values: { ...p.values, ...patch } }, talking).length);
  assert.deepEqual(validateProject({ ...p, values: { ...p.values, edits: [edit] } }, talking), []);
});

test('changing a beat visual supplies its editable required fields and numeric values are checked', () => {
  const control = explainer.controls.find((c) => c.id === 'beats');
  const beat = recordDefaults(control, { role: 'hook', visual: 'stat', text: 'A thought' });
  assert.equal(beat.value, 0);
  assert.equal(beat.label, '');
  const p = newProject(explainer);
  assert.deepEqual(validateProject({ ...p, values: { ...p.values, beats: [beat] } }, explainer), []);
  assert.ok(validateProject({ ...p, values: { ...p.values, beats: [{ role: 'hook', visual: 'stat', text: 'Missing value' }] } }, explainer).length);
  assert.ok(validateProject({ ...p, values: { ...p.values, beats: [{ role: 'hook', visual: 'dots', value: 2, fill: 3 }] } }, explainer).length);
});

test('a slow save keeps newer edits dirty, serializes writes and uses the latest server revision', async () => {
  const state = { project: 'a', revision: 'r0', generation: 0, dirty: true };
  const writes = [], transport = [], dirtyAfter = [];
  const save = createSaveQueue({
    snapshot: () => state.dirty ? { project: state.project, base: state.revision, generation: state.generation } : null,
    write: (request) => { writes.push(request); const d = deferred(); transport.push(d); return d.promise; },
    onSaved: (body, request) => { state.revision = body.revision; state.dirty = request.generation !== state.generation; dirtyAfter.push(state.dirty); return state.dirty; },
    onConflict: () => assert.fail('unexpected conflict'), onError: (error) => assert.fail(error),
  });
  const first = save(); await tick();
  state.project = 'newer'; state.generation++;
  const queued = save();
  assert.equal(writes.length, 1);
  transport[0].resolve({ revision: 'r1' }); await tick();
  assert.equal(state.dirty, true);
  assert.deepEqual(writes[1], { project: 'newer', base: 'r1', generation: 1 });
  transport[1].resolve({ revision: 'r2' });
  assert.equal(await first, true); assert.equal(await queued, true);
  assert.deepEqual(dirtyAfter, [true, false]); assert.equal(state.project, 'newer');
});

test('save conflict and transport failure retain the local draft and stop automatic writes', async () => {
  const state = { project: 'local', revision: 'r0', dirty: true, conflict: null };
  let calls = 0, failure = false, errorSeen = false;
  const save = createSaveQueue({
    snapshot: () => ({ project: state.project, base: state.revision }),
    write: async () => { calls++; if (failure) throw Error('offline'); return { conflict: true, project: 'external', revision: 'r1' }; },
    onSaved: () => assert.fail('must not count conflict as saved'),
    onConflict: (result) => { state.conflict = result; }, onError: () => { errorSeen = true; },
  });
  assert.equal(await save(), false);
  assert.equal(state.project, 'local'); assert.equal(state.dirty, true); assert.equal(calls, 1);
  assert.equal(state.conflict.project, 'external');
  failure = true;
  assert.equal(await save(), false); assert.equal(errorSeen, true); assert.equal(state.dirty, true);
});

test('an older asynchronous stage preparation cannot mount after a newer one', async () => {
  const old = deferred(), painted = [], published = [];
  const load = createLatestLoad({ prepare: (id) => id === 'old' ? old.promise : id, mount: (id) => { painted.push(id); return id; }, publish: (id) => { published.push(id); return id; } });
  const previous = load('old');
  assert.equal(await load('new'), 'new');
  old.resolve('old'); assert.equal(await previous, null);
  assert.deepEqual(painted, ['new']); assert.deepEqual(published, ['new']);
});

test('an older pending font/media mount cannot publish or paint after the newest load', async () => {
  const delayed = deferred(), painted = [], published = [];
  const load = createLatestLoad({
    prepare: (id) => id,
    mount: async (id, isCurrent) => { if (id === 'old') await delayed.promise; if (!isCurrent()) return null; painted.push(id); return id; },
    publish: (id) => { published.push(id); return id; },
  });
  const old = load('old'); await tick();
  assert.equal(await load('new'), 'new'); delayed.resolve(); assert.equal(await old, null);
  assert.deepEqual(painted, ['new']); assert.deepEqual(published, ['new']);
});

test('mountStudio checks current load after font awaits and before changing the DOM', async () => withDom(async () => {
  const font = deferred(), previous = globalThis.FontFace; let current = true;
  globalThis.FontFace = class { load() { return font.promise; } };
  const stage = new Element(), marker = new Element(); stage.appendChild(marker);
  const template = { controls: [], build: () => ({ scenes: [{ duration: 1, layers: [] }] }) };
  try {
    const loading = mountStudio(stage, { brand: { fonts: [{ family: 'wait', src: 'font.ttf' }] }, format: 'reel', fps: 30 }, template, {}, { isCurrent: () => current });
    await tick(); current = false; font.resolve();
    assert.equal(await loading, null); assert.deepEqual(stage.children, [marker]);
  } finally { globalThis.FontFace = previous; }
}));

function folder() {
  const outer = mkdtempSync(join(tmpdir(), 'studio-review-'));
  const root = join(outer, 'project'); mkdirSync(root); mkdirSync(join(root, 'assets')); mkdirSync(join(root, 'templates'));
  writeFileSync(join(root, 'project.json'), JSON.stringify({ template: 'quote-editorial', fps: 30, values: {} }));
  return { outer, root };
}

test('local file serving confines real paths and templates while preserving explicit custom templates', async () => {
  const { outer, root } = folder();
  writeFileSync(join(outer, 'outside.js'), '// OUTSIDE');
  writeFileSync(join(root, 'templates', 'custom.js'), '// INSIDE');
  symlinkSync(join(outer, 'outside.js'), join(root, 'assets', 'external.js'));
  symlinkSync(join(outer, 'outside.js'), join(root, 'templates', 'linked.js'));
  const server = await startServer(root);
  try {
    for (const path of ['/project/assets/external.js', '/template.js?id=../../outside', '/template.js?id=linked']) assert.equal((await fetch(server.url + path)).status, 404, path);
    const response = await fetch(server.url + '/template.js?id=./templates/custom.js');
    assert.equal(response.status, 200); assert.equal(await response.text(), '// INSIDE');
    assert.equal(templatePath('./templates/custom.js', root), realpathSync(join(root, 'templates', 'custom.js')));
  } finally { await server.close(); rmSync(outer, { recursive: true, force: true }); }
});

test('uploading refuses a symlinked asset directory outside the selected project', async () => {
  const { outer, root } = folder(); rmSync(join(root, 'assets'), { recursive: true });
  const outside = join(outer, 'other'); mkdirSync(outside); symlinkSync(outside, join(root, 'assets'));
  const server = await startServer(root);
  try { assert.equal((await fetch(server.url + '/api/upload?name=test.png', { method: 'POST', body: 'test' })).status, 403); }
  finally { await server.close(); rmSync(outer, { recursive: true, force: true }); }
});

let ffmpeg = true; try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch { ffmpeg = false; }
test('effective variant footage is prepared through the same endpoint the stage uses', { skip: !ffmpeg }, async () => {
  const { outer, root } = folder();
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=black:s=32x32:d=0.2', '-c:v', 'libx264', join(root, 'assets', 'b.mp4')]);
  const server = await startServer(root);
  try {
    assert.deepEqual(await (await fetch(server.url + '/api/media')).json(), {});
    const response = await fetch(server.url + '/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: { clip: 'assets/b.mp4' }, fps: 30 }) });
    assert.equal(response.status, 200); assert.equal((await response.json())['assets/b.mp4'].count, 6);
    const invalid = await fetch(server.url + '/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: {}, fps: 0 }) });
    assert.equal(invalid.status, 400);
    writeFileSync(join(outer, 'outside.mp4'), readFileSync(join(root, 'assets', 'b.mp4')));
    await assert.rejects(prepareMedia(root, { fps: 30, values: { clip: '../outside.mp4' } }), /inside the project/);
  } finally { await server.close(); rmSync(outer, { recursive: true, force: true }); }
});


test('invalid video ranges return 416 without killing the server; suffix and ordinary ranges work', async () => {
  const { outer, root } = folder();
  writeFileSync(join(root, 'assets', 'bytes.mp4'), '0123456789');
  const server = await startServer(root);
  try {
    for (const range of ['bytes=999-2', 'bytes=10-', 'bytes=-0', 'bytes=-', 'bytes=invalid']) {
      const response = await fetch(server.url + '/project/assets/bytes.mp4', { headers: { Range: range } });
      assert.equal(response.status, 416, range);
      assert.equal(response.headers.get('Content-Range'), 'bytes */10');
    }
    const suffix = await fetch(server.url + '/project/assets/bytes.mp4', { headers: { Range: 'bytes=-4' } });
    assert.equal(suffix.status, 206); assert.equal(await suffix.text(), '6789');
    const segment = await fetch(server.url + '/project/assets/bytes.mp4', { headers: { Range: 'bytes=2-4' } });
    assert.equal(segment.status, 206); assert.equal(await segment.text(), '234');
    assert.equal((await fetch(server.url + '/api/project')).status, 200);
  } finally { await server.close(); rmSync(outer, { recursive: true, force: true }); }
});


test('missing B-roll nested in overlay groups is a blocking media finding', () => {
  const studio = { mode: 'still', duration: 1, ctx: { format: resolveFormat('reel') }, textLayers: () => [], scenes: [], overlays: [{ kind: 'group', children: [{ kind: 'video', id: 'broll', broken: true, spec: { src: 'assets/missing.mp4' } }] }] };
  const result = lintStudio(studio);
  assert.ok(result.some((item) => item.level === 'error' && item.rule === 'missing-media' && item.where === 'overlay broll'));
});

test('a delayed project poll cannot adopt after an edit, conflict, adoption or completed save', async () => {
  for (const change of [
    (state) => { state.dirty = true; },
    (state) => { state.conflict = { revision: 'other' }; },
    (state) => { state.editGeneration++; },
    (state) => { state.revision = 'saved-newer'; },
  ]) {
    const state = { project: 'local', revision: 'r0', editGeneration: 0, dirty: false, conflict: null };
    const response = deferred(); let adopted = false;
    const pending = pollSavedProject({ state, read: () => response.promise, adopt: () => { adopted = true; }, onError: (error) => assert.fail(error) });
    change(state);
    response.resolve({ revision: 'stale-disk', project: 'older' });
    assert.equal(await pending, false); assert.equal(adopted, false); assert.equal(state.project, 'local');
  }
});

test('a clean unchanged poll adopts a fresh disk revision and skips reads while editing', async () => {
  const state = { project: 'local', revision: 'r0', editGeneration: 0, dirty: false, conflict: null }; let reads = 0;
  const poll = () => pollSavedProject({ state, read: async () => { reads++; return { revision: 'r1', project: 'fresh' }; }, adopt: (value) => { state.project = value.project; state.revision = value.revision; }, onError: (error) => assert.fail(error) });
  assert.equal(await poll(), true); assert.equal(state.project, 'fresh');
  state.dirty = true; assert.equal(await poll(), false); assert.equal(reads, 1);
});

test('polling fetch failures are caught without replacing drafts or overriding newer edit feedback', async () => {
  const state = { project: 'local', revision: 'r0', editGeneration: 0, dirty: false, conflict: null }; let errors = 0;
  const response = deferred();
  const pending = pollSavedProject({ state, read: () => response.promise, adopt: () => assert.fail('must not adopt'), onError: () => { errors++; } });
  state.dirty = true; state.editGeneration++;
  response.reject(Error('offline')); assert.equal(await pending, false); assert.equal(errors, 0); assert.equal(state.project, 'local');
  state.dirty = false;
  assert.equal(await pollSavedProject({ state, read: async () => { throw Error('offline'); }, adopt: () => assert.fail('must not adopt'), onError: () => { errors++; } }), false);
  assert.equal(errors, 1); assert.equal(state.project, 'local');
});
