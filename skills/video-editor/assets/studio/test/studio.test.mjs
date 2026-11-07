import test from 'node:test';
import assert from 'node:assert/strict';
import { bezier, clamp, curve, rng, spring } from '../runtime/easing.js';
import { FORMATS, checkValue, contextFor, newProject, readSeconds, resolveFormat, validateProject, wordCount } from '../runtime/schema.js';
import { montagePlan, remapWords, timelineFromEdits } from '../runtime/kit.js';
import { contrastOf, contrastRatio, hexToRgb } from '../runtime/lint.js';
import { maxFlashesPerSecond } from '../lib/qa.mjs';
import { readdirSync } from 'node:fs';

const templates = await Promise.all(readdirSync(new URL('../templates/', import.meta.url)).filter((f) => f.endsWith('.js')).map((f) => import(`../templates/${f}`)));

test('curves start at 0, end at 1 and stay deterministic', () => {
  for (const name of ['linear', 'out-soft', 'out-expo', 'in-out-strong', 'overshoot', 'spring-soft']) {
    const c = curve(name);
    assert.equal(c(0), 0, name);
    assert.equal(c(1), 1, name);
    assert.equal(c(0.37), c(0.37), name);
  }
  assert.ok(curve('overshoot')(0.7) > 1, 'overshoot passes its target');
  assert.ok(spring(0.3)(0.5) > 0.5);
  assert.ok(Math.abs(bezier(0.25, 0.25, 0.75, 0.75)(0.5) - 0.5) < 0.01);
  assert.equal(clamp(2), 1);
  assert.deepEqual([rng(4)(), rng(4)()], [rng(4)(), rng(4)()].slice(0, 2));
});

test('out curves reach readable position early', () => {
  assert.ok(curve('out-expo')(0.3) > 0.7);
});

test('reading time grows with words and respects the floor', () => {
  assert.equal(wordCount('one *two* three'), 3);
  assert.ok(readSeconds('short') >= 5 / 6);
  assert.ok(readSeconds('a b c d e f g h i j') > readSeconds('a b c'));
});

test('safe profiles scale to the format', () => {
  const f = resolveFormat('reel', { safeProfile: 'meta-ads' });
  assert.equal(Math.round(f.safe.bottom), Math.round(1920 * 0.35));
  assert.equal(resolveFormat('reel', { safe: { top: 300 } }).safe.top, 300);
  assert.throws(() => resolveFormat('nope'));
});

test('validation rejects typos and out-of-range values', () => {
  const t = templates.find((x) => x.meta.id === 'quote-editorial');
  const p = newProject(t);
  assert.deepEqual(validateProject(p, t), []);
  assert.match(validateProject({ ...p, values: { qoute: 'x' } }, t)[0], /not a control/);
  assert.match(validateProject({ ...p, values: { scale: 40 } }, t)[0], /at most/);
  assert.match(validateProject({ ...p, fps: 29 }, t)[0], /fps/);
  assert.equal(checkValue({ id: 'c', type: 'color' }, 'red'), 'c: must be a six-digit hex colour');
});

test('every template builds in every format and mode without a DOM', () => {
  assert.ok(templates.length >= 5);
  for (const t of templates) {
    assert.ok(t.meta.status && t.meta.summary, t.meta.id);
    for (const format of t.meta.formats) {
      assert.ok(FORMATS[format], format);
      for (const mode of ['video', 'still']) {
        const p = newProject(t, format);
        const tl = t.build(contextFor(p, t, { mode }));
        assert.ok(tl.scenes.length, `${t.meta.id} ${format}`);
        for (const s of tl.scenes) assert.ok(s.duration > 0, `${t.meta.id} scene duration`);
      }
    }
    const ids = t.controls.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, `${t.meta.id} duplicate control`);
  }
});

test('captions follow the edit: dropped takes vanish, later words shift', () => {
  const words = [{ w: 'cut', s: 0.2, e: 0.5 }, { w: 'kept', s: 2.1, e: 2.4 }, { w: 'also', s: 3.2, e: 3.5 }];
  const edits = [{ in: 2, out: 2.6 }, { in: 3.1, out: 4 }];
  assert.deepEqual(timelineFromEdits(edits).map((s) => Number(s.at.toFixed(2))), [0, 0.6]);
  const out = remapWords(words, edits);
  assert.deepEqual(out.map((w) => w.w), ['kept', 'also']);
  assert.ok(Math.abs(out[0].s - 0.1) < 1e-9);
  assert.ok(Math.abs(out[1].s - 0.7) < 1e-9);
});

test('captions follow a later hook when it is replayed in the body of the short', () => {
  const words = [{ w: 'setup', s: 0.25, e: 0.5 }, { w: 'result', s: 4.25, e: 4.75 }];
  const edits = [{ in: 4, out: 5 }, { in: 0, out: 1 }, { in: 4, out: 5 }];
  assert.deepEqual(remapWords(words, edits), [
    { w: 'result', s: 0.25, e: 0.75 },
    { w: 'setup', s: 1.25, e: 1.5 },
    { w: 'result', s: 2.25, e: 2.75 },
  ]);
});

test('montage roles set shot length and an override wins', () => {
  const plan = montagePlan([{ role: 'establish' }, { role: 'peak' }, { role: 'peak', beats: 2 }], 120);
  assert.deepEqual(plan.map((c) => c.seconds), [2, 0.5, 1]);
  const [withWords] = montagePlan([{ role: 'detail', text: 'Old friends' }], 120);
  assert.ok(withWords.seconds >= 1.5, 'a shot with words earns reading time');
  assert.equal(withWords.beats % 1, 0);
});

test('contrast uses the worst realistic pixels, not the average', () => {
  assert.equal(Math.round(contrastRatio([255, 255, 255], [0, 0, 0])), 21);
  const white = hexToRgb('#FFFFFF');
  const mostlyDark = new Array(400 * 4).fill(0).map((_, i) => (i % 4 === 3 ? 255 : (Math.floor(i / 4) % 5 === 0 ? 250 : 10)));
  const r = contrastOf(white, mostlyDark);
  assert.ok(r.worst < 2 && r.median > 10);
});

test('flash counter flags strobing and ignores a single cut', () => {
  const strobe = Array.from({ length: 60 }, (_, i) => (Math.floor(i / 3) % 2 ? 0.7 : 0.05));
  assert.ok(maxFlashesPerSecond(strobe, 30) > 3);
  const cut = [...new Array(30).fill(0.1), ...new Array(30).fill(0.7)];
  assert.ok(maxFlashesPerSecond(cut, 30) <= 1);
});
