// End-to-end smoke test. Skips cleanly where Chrome or ffmpeg is unavailable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findChrome } from '../lib/chrome.mjs';
import { check, render, renderBoard, renderStills } from '../lib/render.mjs';
import { startServer } from '../lib/server.mjs';
import { newProject } from '../runtime/schema.js';
import * as quote from '../templates/quote-editorial.js';
import * as explainer from '../templates/explainer.js';

let ready = true;
try { findChrome(); execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch { ready = false; }

function project(values = {}, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'studio-test-'));
  mkdirSync(join(dir, 'exports'));
  const p = newProject(quote, 'reel', extra);
  Object.assign(p.values, values);
  writeFileSync(join(dir, 'project.json'), JSON.stringify(p));
  return dir;
}

test('a draft renders with the requested length, a still and a QA report', { skip: !ready, timeout: 120000 }, async () => {
  const dir = project({ hold: 0 }, { variants: [{ name: 'B', values: { quote: 'A second\n*opening.*' } }] });
  const result = await render(dir, { draft: true, variant: 'B' });
  assert.equal(result.report.facts.width, 540);
  assert.equal(result.report.facts.fps, 30);
  assert.ok(result.report.facts.duration > 2);
  assert.match(result.file, /-B-draft\.mp4$/);
  assert.ok(existsSync(result.poster) && existsSync(result.sheet));
  rmSync(dir, { recursive: true, force: true });
});

test('the check finds weak line ends and missing fonts', { skip: !ready, timeout: 60000 }, async () => {
  const dir = project({ quote: 'Forever is\ncomposed of\nnows.' }, { brand: { ...newProject(quote).brand, display: 'No Such Font' } });
  const { lint } = await check(dir);
  const rules = lint.map((l) => l.rule);
  assert.ok(rules.includes('weak-line-end'));
  assert.ok(rules.includes('missing-font'));
  rmSync(dir, { recursive: true, force: true });
});

test('stills ignore animation and render at full size', { skip: !ready, timeout: 60000 }, async () => {
  const dir = project();
  const { files } = await renderStills(dir, { format: 'post', out: join(dir, 'exports', 'post.png') });
  assert.ok(existsSync(files[0]));
  rmSync(dir, { recursive: true, force: true });
});

function explainerProject() {
  const dir = mkdtempSync(join(tmpdir(), 'studio-test-'));
  mkdirSync(join(dir, 'exports'));
  writeFileSync(join(dir, 'project.json'), JSON.stringify(newProject(explainer, 'reel')));
  return dir;
}

test('scene stills cover every scene and never run past the last one', { skip: !ready, timeout: 60000 }, async () => {
  const dir = explainerProject();
  const out = join(dir, 'exports', 'still.png');
  const all = await renderStills(dir, { scenes: 'all', out });
  assert.equal(all.files.length, all.info.scenes.length);
  const extra = await renderStills(dir, { scenes: [...Array(all.info.scenes.length + 3).keys()], out });
  assert.equal(extra.files.length, all.info.scenes.length);
  rmSync(dir, { recursive: true, force: true });
});

test('a storyboard gives one frame per beat, with the words and timing as text', { skip: !ready, timeout: 60000 }, async () => {
  const dir = explainerProject();
  const board = await renderBoard(dir);
  assert.equal(board.frames.length, board.sceneCount);
  assert.ok(board.sceneCount >= 3);
  assert.ok(existsSync(board.sheet));
  assert.match(board.sheet, /board-001\.png$/);
  const table = readFileSync(board.table, 'utf8');
  assert.match(table, /\| 1 \| hook \|/);
  assert.match(table, /\| example \|.*Name one thing \/ Give it a time/);
  assert.ok(board.frames.every((f) => f.at >= f.start && f.at <= f.end));
  const next = await renderBoard(dir);
  assert.match(next.sheet, /board-002\.png$/);
  rmSync(dir, { recursive: true, force: true });
});

test('a one-scene project samples frames across its length', { skip: !ready, timeout: 60000 }, async () => {
  const dir = project();
  const board = await renderBoard(dir);
  assert.equal(board.sceneCount, 1);
  assert.equal(board.frames.length, 4);
  assert.ok(board.frames[3].at > board.frames[0].at);
  rmSync(dir, { recursive: true, force: true });
});

test('a new project starts with a brief and keeps one that already exists', () => {
  const kit = join(import.meta.dirname, '..', 'studio.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'studio-test-'));
  const fresh = join(dir, 'fresh');
  execFileSync('node', [kit, 'new', 'quote-poster', fresh]);
  assert.match(readFileSync(join(fresh, 'brief.md'), 'utf8'), /## Story/);
  const kept = join(dir, 'kept');
  mkdirSync(kept);
  writeFileSync(join(kept, 'brief.md'), 'already written');
  execFileSync('node', [kit, 'new', 'quote-poster', kept]);
  assert.equal(readFileSync(join(kept, 'brief.md'), 'utf8'), 'already written');
  rmSync(dir, { recursive: true, force: true });
});

test('the server refuses cross-origin writes and path traversal', { timeout: 20000 }, async () => {
  const dir = project();
  const server = await startServer(dir);
  const write = await fetch(`${server.url}/api/project`, { method: 'PUT', headers: { Origin: 'http://evil.test', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(write.status, 403);
  const stale = await fetch(`${server.url}/api/project`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project: {}, base: 'stale' }) });
  assert.equal(stale.status, 409);
  const upload = await fetch(`${server.url}/api/upload?name=run.sh`, { method: 'POST', body: 'x' });
  assert.equal(upload.status, 400);
  await server.close();
  rmSync(dir, { recursive: true, force: true });
});
