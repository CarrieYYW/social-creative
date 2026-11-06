// Headless capture of the same stage the editor shows, then encode, mix, inspect and version.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { join } from 'node:path';
import { launchChrome } from './chrome.mjs';
import { readProject, startServer } from './server.mjs';
import { audioPlan, mixAudio } from './audio.mjs';
import { qa } from './qa.mjs';
import { contrastOf, hexToRgb } from '../runtime/lint.js';

export function applyVariant(project, name) {
  if (!name) return project;
  const variant = (project.variants || []).find((v) => v.name === name);
  if (!variant) throw new Error(`No variant "${name}". Project has: ${(project.variants || []).map((v) => v.name).join(', ') || 'none'}`);
  return { ...project, values: { ...project.values, ...variant.values } };
}

function nextVersion(folder) {
  mkdirSync(folder, { recursive: true });
  const used = readdirSync(folder).map((f) => Number(f.match(/^v(\d+)/)?.[1] || 0));
  return String(Math.max(0, ...used) + 1).padStart(3, '0');
}

async function openStage(chrome, url, project, format, scale, mode) {
  const { FORMATS } = await import('../runtime/schema.js');
  const f = FORMATS[format];
  const page = await chrome.page(f.w, f.h, scale);
  const errors = [];
  page.on((m) => {
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });
  await page.goto(`${url}/stage`);
  await page.evaluate(`new Promise((r)=>{const c=()=>window.stageReady?r():setTimeout(c,20);c()})`);
  try {
    const info = await page.evaluate(`window.stageApi.load(${JSON.stringify(project)},${JSON.stringify({ format, mode })})`);
    return { page, info };
  } catch (error) {
    throw new Error(`${error.message}${errors.length ? `\n${errors.join('\n')}` : ''}`);
  }
}

export async function renderStills(root, { format, variant, times, scenes, out, chrome: shared, url: sharedUrl } = {}) {
  const project = applyVariant(readProject(root), variant);
  const fmt = format || project.format;
  const server = sharedUrl ? null : await startServer(root);
  const chrome = shared || await launchChrome();
  const url = sharedUrl || server.url;
  const results = [];
  try {
    const { page, info } = await openStage(chrome, url, project, fmt, 1, 'still');
    const count = info.scenes.length;
    const list = scenes === 'all' ? [...Array(count).keys()] : scenes ? scenes.filter((i) => i < count) : [undefined];
    for (let i = 0; i < list.length; i++) {
      await page.evaluate(`window.stageApi.seek(0,${JSON.stringify({ still: true, scene: list[i] })})`);
      const data = await page.shot({ format: 'png' });
      const name = list.length > 1 ? out.replace(/\.png$/, `-${String(i + 1).padStart(2, '0')}.png`) : out;
      writeFileSync(name, data);
      results.push(name);
    }
    page.close();
    if (times?.length) {
      const live = await openStage(chrome, url, project, fmt, 1, 'video');
      for (const t of times) {
        await live.page.evaluate(`window.stageApi.seek(${t})`);
        const name = out.replace(/\.png$/, `-t${String(t).replace('.', '_')}.png`);
        writeFileSync(name, await live.page.shot({ format: 'png' }));
        results.push(name);
      }
      live.page.close();
    }
    return { files: results, info };
  } finally {
    if (!shared) chrome.close();
    await server?.close();
  }
}

function nextBoard(folder, suffix) {
  mkdirSync(folder, { recursive: true });
  const used = readdirSync(folder).map((f) => Number(f.match(/^board-(\d+)/)?.[1] || 0));
  return `board-${String(Math.max(0, ...used) + 1).padStart(3, '0')}${suffix}`;
}

// Projects with one or two scenes change within the scene, so sample the reveal and the ending instead.
function boardFrames(beats, duration) {
  if (beats.length >= 3) return beats;
  const settled = beats.at(-1)?.at ?? duration;
  const marks = [settled * 0.15, settled * 0.55, settled, duration * 0.97];
  return marks.map((at, i) => ({
    index: i, role: beats[0]?.role ?? '', start: at, end: marks[i + 1] ?? duration, at, words: i ? '' : beats.map((b) => b.words).filter(Boolean).join(' / '),
  }));
}

const clock = (t) => `${t.toFixed(1)}s`;
const cell = (text) => String(text ?? '').replace(/\|/g, '\\|');

function beatTable(project, frames) {
  const story = project.story || {};
  const head = ['promise', 'payoff'].filter((k) => story[k]).map((k) => `${k[0].toUpperCase()}${k.slice(1)}: ${story[k]}`);
  const rows = frames.map((f, i) => `| ${i + 1} | ${cell(f.role)} | ${clock(f.start)} | ${(f.end - f.start).toFixed(1)}s | ${cell(f.words)} |`);
  return [...head, ...(head.length ? [''] : []), '| # | Role | Starts | Length | Words |', '|---|---|---|---|---|', ...rows, ''].join('\n');
}

// Draws the sheet in the browser with DOM text, so copy never needs escaping or a font on the system.
function sheetScript({ frames, images, w, h, heading }) {
  const data = { cards: frames.map((f, i) => ({ src: images[i], title: `${i + 1}  ${f.role}  ${clock(f.start)}, ${(f.end - f.start).toFixed(1)}s`, words: f.words })), heading };
  const width = w > h ? 420 : 280;
  const widest = w > h ? 3 : 5;
  const columns = Math.ceil(frames.length / Math.ceil(frames.length / widest));
  return `(async () => {
    const data = ${JSON.stringify(data)};
    const make = (tag, css, text) => { const el = document.createElement(tag); el.style.cssText = css; if (text) el.textContent = text; return el; };
    document.body.style.cssText = 'margin:0;padding:28px;background:#fff;color:#161412;font:15px/1.35 -apple-system,Helvetica,Arial,sans-serif;width:max-content';
    for (const line of data.heading) document.body.append(make('div', 'margin-bottom:4px;font-weight:600;max-width:${columns * (width + 20) - 20}px', line));
    const grid = make('div', 'display:grid;grid-template-columns:repeat(${columns},${width}px);gap:24px 20px;margin-top:18px');
    for (const card of data.cards) {
      const item = make('div', '');
      const image = make('img', 'display:block;width:100%;background:#eee');
      image.src = card.src;
      item.append(image, make('div', 'margin-top:8px;font-weight:600', card.title), make('div', 'color:#55504A;margin-top:2px', card.words));
      grid.append(item);
    }
    document.body.append(grid);
    await Promise.all([...document.images].map((i) => i.decode()));
    const box = grid.getBoundingClientRect();
    return { width: Math.ceil(box.right + 28), height: Math.ceil(box.bottom + 28) };
  })()`;
}

// A storyboard: one real frame per beat on one sheet, plus the same beats as text.
export async function renderBoard(root, { format, variant } = {}) {
  const project = applyVariant(readProject(root), variant);
  const fmt = format || project.format;
  const server = await startServer(root);
  const chrome = await launchChrome();
  try {
    const { page, info } = await openStage(chrome, server.url, project, fmt, 0.4, 'video');
    const beats = await page.evaluate('window.stageApi.beats()');
    const lint = await page.evaluate('window.stageApi.lint()');
    const frames = boardFrames(beats, info.duration);
    const images = [];
    for (const frame of frames) {
      await page.evaluate(`window.stageApi.seek(${frame.at})`);
      images.push(`data:image/jpeg;base64,${(await page.shot({ format: 'jpeg', quality: 84 })).toString('base64')}`);
    }
    page.close();
    const story = project.story || {};
    const heading = [
      `${project.template}, ${fmt}${variant ? `, variant ${variant}` : ''}, ${info.duration.toFixed(1)}s`,
      ...['promise', 'payoff'].filter((k) => story[k]).map((k) => `${k[0].toUpperCase()}${k.slice(1)}: ${story[k]}`),
    ];
    const sheetPage = await chrome.page(1600, 900, 1);
    const size = await sheetPage.evaluate(sheetScript({ frames, images, w: info.w, h: info.h, heading }));
    await sheetPage.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: 1, mobile: false });
    const folder = join(root, 'exports');
    const name = nextBoard(folder, variant ? `-${variant}` : '');
    const sheet = join(folder, `${name}.png`);
    const table = join(folder, `${name}.md`);
    writeFileSync(sheet, await sheetPage.shot({ format: 'png' }));
    writeFileSync(table, beatTable(project, frames));
    sheetPage.close();
    return { sheet, table, frames, sceneCount: beats.length, duration: info.duration, lint };
  } finally {
    chrome.close();
    await server.close();
  }
}

export async function render(root, opts = {}, onProgress = () => {}) {
  const base = readProject(root);
  const project = applyVariant(base, opts.variant);
  const format = opts.format || project.format;
  const draft = !!opts.draft;
  const scale = draft ? 0.5 : 1;
  const server = await startServer(root);
  const chrome = await launchChrome();
  const stamp = Date.now().toString(36);
  const frames = join(root, '.cache', `render-${stamp}`);
  mkdirSync(frames, { recursive: true });
  try {
    onProgress(0.01, 'Loading');
    const workers = Math.max(1, Math.min(opts.workers ?? 4, cpus().length - 1));
    const first = await openStage(chrome, server.url, project, format, scale, 'video');
    const lint = await first.page.evaluate('window.stageApi.lint()');
    const blocking = lint.filter((l) => l.level === 'error');
    if (blocking.length && !opts.force) throw new Error(`Fix before rendering:\n${blocking.map((b) => `- ${b.rule}: ${b.message}`).join('\n')}`);
    const { duration, fps } = first.info;
    const blur = draft ? 0 : project.motionBlur || 0;
    const sub = blur ? 4 : 1;
    const shutter = blur / 360;
    const total = Math.round(duration * fps);
    const count = total * sub;
    const pages = [first.page];
    for (let i = 1; i < workers; i++) pages.push((await openStage(chrome, server.url, project, format, scale, 'video')).page);
    const ext = draft ? 'jpg' : 'png';
    let done = 0;
    const chunk = Math.ceil(count / pages.length);
    await Promise.all(pages.map(async (page, w) => {
      for (let i = w * chunk; i < Math.min(count, (w + 1) * chunk); i++) {
        const f = Math.floor(i / sub), k = i % sub;
        const t = (f + (sub > 1 ? (k / sub) * shutter : 0)) / fps;
        await page.evaluate(`window.stageApi.seek(${t})`);
        const data = await page.shot(draft ? { format: 'jpeg', quality: 86 } : { format: 'png' });
        writeFileSync(join(frames, `${String(i).padStart(7, '0')}.${ext}`), data);
        done++;
        if (done % 12 === 0) onProgress(0.03 + 0.82 * (done / count), `Frame ${Math.ceil(done / sub)} of ${total}`);
      }
    }));
    const timeline = await first.page.evaluate('window.stageApi.studio.timeline');
    onProgress(0.86, 'Encoding');
    const folder = join(root, 'exports');
    const version = opts.version || nextVersion(folder);
    const label = `v${version}-${format}${opts.variant ? `-${opts.variant}` : ''}${draft ? '-draft' : ''}`;
    const silent = join(frames, 'silent.mp4');
    const filters = [];
    if (sub > 1) filters.push(`tmix=frames=${sub}`, `select='not(mod(n+1\\,${sub}))'`, `setpts=N/(${fps}*TB)`);
    filters.push('scale=out_color_matrix=bt709:out_range=tv', 'format=yuv420p');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps * sub), '-start_number', '0', '-i', join(frames, `%07d.${ext}`),
      '-vf', filters.join(','), '-r', String(fps), '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'slow', '-crf', draft ? '24' : '16',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', silent]);
    onProgress(0.92, 'Mixing sound');
    const file = join(folder, `${label}.mp4`);
    const mixed = join(frames, 'mix.m4a');
    if (mixAudio(root, audioPlan(project, timeline), duration, mixed)) {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', mixed, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-shortest', '-movflags', '+faststart', file]);
    } else {
      copyFileSync(silent, file);
    }
    onProgress(0.95, 'Checking');
    const { files: [poster] } = await renderStills(root, { format, variant: opts.variant, out: join(folder, `${label}-still.png`), chrome, url: server.url });
    const sheet = join(folder, `${label}-sheet.png`);
    const cols = 6, rows = 2;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `fps=${(cols * rows) / duration},scale=270:-2,tile=${cols}x${rows}:padding=6:color=0x202020`, '-frames:v', '1', '-update', '1', sheet]);
    const report = qa(file);
    writeFileSync(join(folder, `${label}.json`), `${JSON.stringify(project, null, 2)}\n`);
    writeFileSync(join(folder, `${label}-qa.json`), `${JSON.stringify({ ...report, lint }, null, 2)}\n`);
    onProgress(1, 'Finished');
    return { file, poster, sheet, report, lint, label };
  } finally {
    chrome.close();
    await server.close();
    rmSync(frames, { recursive: true, force: true });
  }
}

// Layout lint plus contrast measured against the real pixels behind each text block.
export async function check(root, { format, variant } = {}) {
  const project = applyVariant(readProject(root), variant);
  const fmt = format || project.format;
  const server = await startServer(root);
  const chrome = await launchChrome();
  try {
    const { page, info } = await openStage(chrome, server.url, project, fmt, 1, 'video');
    const lint = await page.evaluate('window.stageApi.lint()');
    const boxes = await page.evaluate('window.stageApi.textBoxes()');
    for (const b of boxes) {
      await page.evaluate(`window.stageApi.seek(${b.rest})`);
      await page.evaluate('window.stageApi.setTextVisible(false)');
      const shot = await page.shot({ format: 'png' });
      await page.evaluate('window.stageApi.setTextVisible(true)');
      const data = await page.evaluate(`window.stageApi.pixels(${JSON.stringify(`data:image/png;base64,${shot.toString('base64')}`)},${JSON.stringify(b.box)})`);
      if (!data || !/^#/.test(b.color || '')) continue;
      const c = contrastOf(hexToRgb(b.color), data);
      const need = b.size >= 54 ? 3 : 4.5;
      if (c.worst < need) lint.push({ level: 'warn', rule: 'contrast', message: `Contrast falls to ${c.worst.toFixed(1)}:1 behind this text (median ${c.median.toFixed(1)}:1). Aim for ${need}:1.`, where: b.id });
    }
    return { info, lint };
  } finally {
    chrome.close();
    await server.close();
  }
}

export async function audioPreview(root, { format } = {}) {
  const project = readProject(root);
  const server = await startServer(root);
  const chrome = await launchChrome();
  try {
    const { page, info } = await openStage(chrome, server.url, project, format || project.format, 0.25, 'video');
    const timeline = await page.evaluate('window.stageApi.studio.timeline');
    mkdirSync(join(root, '.cache'), { recursive: true });
    const out = join(root, '.cache', 'audio-preview.m4a');
    const has = mixAudio(root, audioPlan(project, timeline), info.duration, out);
    return { path: has ? '.cache/audio-preview.m4a' : null };
  } finally {
    chrome.close();
    await server.close();
  }
}
