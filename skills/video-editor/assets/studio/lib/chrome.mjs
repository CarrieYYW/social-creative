// Minimal Chrome DevTools Protocol client: no npm packages, Node 22+ provides WebSocket and fetch.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

export function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const path of candidates) if (existsSync(path)) return path;
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(cache)) {
    for (const dir of readdirSync(cache).filter((d) => /^chromium-\d+/.test(d)).sort().reverse()) {
      for (const sub of ['chrome-mac-arm64', 'chrome-mac']) {
        for (const app of ['Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'Chromium.app/Contents/MacOS/Chromium']) {
          const path = join(cache, dir, sub, app);
          if (existsSync(path)) return path;
        }
      }
    }
  }
  throw new Error('No Chrome or Chromium found. Install Chrome or set CHROME_PATH.');
}

export async function launchChrome() {
  const dir = mkdtempSync(join(tmpdir(), 'studio-chrome-'));
  const proc = spawn(findChrome(), [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
    '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-lcd-text',
    '--font-render-hinting=none', '--mute-audio', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not start within 20 s.')), 20000);
    proc.stderr.on('data', (d) => {
      buffer += d;
      const m = buffer.match(/ws:\/\/[^\s]+/);
      if (m) { clearTimeout(timer); resolve(m[0]); }
    });
    proc.on('exit', (code) => reject(new Error(`Chrome exited early (${code}).`)));
  });
  const port = new URL(endpoint).port;
  return {
    async page(width, height, scale = 1) {
      const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      const target = await res.json();
      const page = await connect(target.webSocketDebuggerUrl);
      await page.send('Page.enable');
      await page.send('Runtime.enable');
      await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
      return page;
    },
    close() {
      proc.removeAllListeners('exit');
      proc.kill();
      setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch {} }, 300);
    },
  };
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(new Error('CDP socket failed.')); });
  let id = 0;
  const waiting = new Map();
  const listeners = [];
  socket.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && waiting.has(m.id)) {
      const { resolve, reject } = waiting.get(m.id);
      waiting.delete(m.id);
      if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
    } else if (m.method) {
      for (const fn of listeners) fn(m);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    waiting.set(n, { resolve, reject });
    socket.send(JSON.stringify({ id: n, method, params }));
  });
  const page = {
    send,
    on: (fn) => listeners.push(fn),
    async evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) {
        const detail = r.exceptionDetails.exception?.description || r.exceptionDetails.text;
        throw new Error(detail);
      }
      return r.result.value;
    },
    async goto(target) {
      const loaded = new Promise((resolve) => {
        const fn = (m) => { if (m.method === 'Page.loadEventFired') resolve(); };
        listeners.push(fn);
      });
      await send('Page.navigate', { url: target });
      await loaded;
    },
    async shot({ format = 'png', quality = 92 } = {}) {
      const params = { format, optimizeForSpeed: true };
      if (format === 'jpeg') params.quality = quality;
      const r = await send('Page.captureScreenshot', params);
      return Buffer.from(r.data, 'base64');
    },
    close() { socket.close(); },
  };
  return page;
}
