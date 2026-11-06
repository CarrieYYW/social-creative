// Local-only server shared by the editor and the renderer, so preview and export run the same code path.
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, renameSync, realpathSync } from 'node:fs';
import { basename, dirname, extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { prepareMedia } from './media.mjs';

export const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp4': 'video/mp4',
  '.mov': 'video/quicktime', '.webm': 'video/webm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
const UPLOAD_TYPES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.mov', '.webm', '.wav', '.mp3', '.m4a', '.otf', '.ttf', '.woff', '.woff2']);

const within = (root, path) => {
  const full = resolve(root, path);
  if (full !== root && !full.startsWith(root + sep)) return null;
  if (!existsSync(full)) return null;
  const canonicalRoot = realpathSync(root), canonical = realpathSync(full);
  return canonical === canonicalRoot || canonical.startsWith(canonicalRoot + sep) ? canonical : null;
};

export const projectFile = (dir) => join(dir, 'project.json');
export const readProject = (dir) => JSON.parse(readFileSync(projectFile(dir), 'utf8'));
export const revisionOf = (text) => createHash('sha1').update(text).digest('hex').slice(0, 12);

export function templatePath(id, dir) {
  if (typeof id !== 'string' || !id) return null;
  if (id.startsWith('./')) return /\.m?js$/.test(id) ? within(resolve(dir), id) : null;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  const local = join(dir, 'templates', `${id}.js`);
  return existsSync(local) ? within(resolve(dir), `templates/${id}.js`) : within(KIT, `templates/${id}.js`);
}

export function listTemplates() {
  return readdirSync(join(KIT, 'templates')).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, ''));
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function serveFile(req, res, file) {
  if (!file || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: 'Not found' });
  const size = statSync(file).size;
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  if (req.headers.range) {
    const range = req.headers.range.match(/^bytes=(\d*)-(\d*)$/);
    let start, end;
    if (range && (range[1] || range[2])) {
      if (range[1]) { start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1; }
      else { const suffix = Number(range[2]); start = Math.max(0, size - suffix); end = size - 1; }
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
      res.setHeader('Content-Range', `bytes */${size}`);
      return send(res, 416, { error: 'Requested byte range is not satisfiable.' });
    }
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-store' });
    return createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
  createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

const readBody = (req, limit) => new Promise((resolveBody, reject) => {
  const chunks = [];
  let total = 0;
  req.on('data', (c) => {
    total += c.length;
    if (total > limit) { reject(new Error('Upload too large.')); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', () => resolveBody(Buffer.concat(chunks)));
  req.on('error', reject);
});

export async function startServer(dir, { port = 0, actions = {} } = {}) {
  const root = realpathSync(resolve(dir));
  const state = { job: null };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const path = decodeURIComponent(url.pathname);
      const host = req.headers.host || '';
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) return send(res, 403, { error: 'Local access only.' });
      const unsafe = !['GET', 'HEAD'].includes(req.method);
      if (unsafe) {
        const origin = req.headers.origin;
        if (origin && origin !== `http://${host}`) return send(res, 403, { error: 'Cross-origin write refused.' });
      }

      if (path === '/') return serveFile(req, res, join(KIT, 'editor/editor.html'));
      if (path === '/stage') return serveFile(req, res, join(KIT, 'runtime/stage.html'));
      if (path.startsWith('/runtime/')) return serveFile(req, res, within(join(KIT, 'runtime'), path.slice(9)));
      if (path.startsWith('/editor/')) return serveFile(req, res, within(join(KIT, 'editor'), path.slice(8)));
      if (path.startsWith('/project/')) return serveFile(req, res, within(root, path.slice(9)));
      if (path === '/template.js') {
        const project = readProject(root);
        return serveFile(req, res, templatePath(url.searchParams.get('id') || project.template, root));
      }

      if (path === '/api/project' && req.method === 'GET') {
        const text = readFileSync(projectFile(root), 'utf8');
        return send(res, 200, { revision: revisionOf(text), project: JSON.parse(text) });
      }
      if (path === '/api/project' && req.method === 'PUT') {
        if (!(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'JSON required.' });
        const { project, base } = JSON.parse((await readBody(req, 5e6)).toString());
        const current = readFileSync(projectFile(root), 'utf8');
        if (base && base !== revisionOf(current)) return send(res, 409, { error: 'Changed elsewhere.', revision: revisionOf(current), project: JSON.parse(current) });
        const text = `${JSON.stringify(project, null, 2)}\n`;
        const tmp = `${projectFile(root)}.tmp`;
        writeFileSync(tmp, text);
        renameSync(tmp, projectFile(root));
        return send(res, 200, { revision: revisionOf(text) });
      }
      if (path === '/api/media' && ['GET', 'POST'].includes(req.method)) {
        let project = readProject(root);
        if (req.method === 'POST') {
          if (!(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'JSON required.' });
          const effective = JSON.parse((await readBody(req, 5e6)).toString());
          if (!effective || !effective.values || typeof effective.values !== 'object' || Array.isArray(effective.values) || ![24, 25, 30, 60].includes(effective.fps)) return send(res, 400, { error: 'Valid effective media values and frame rate required.' });
          project = { ...project, values: effective.values, fps: effective.fps };
        }
        const proxy = url.searchParams.get('proxy') === '1';
        return send(res, 200, await prepareMedia(root, project, { proxy }));
      }
      if (path === '/api/upload' && req.method === 'POST') {
        const name = basename(url.searchParams.get('name') || '').replace(/[^\w.\- ]+/g, '_');
        const ext = extname(name).toLowerCase();
        if (!name || !UPLOAD_TYPES.has(ext)) return send(res, 400, { error: `Unsupported file type ${ext || ''}.` });
        const data = await readBody(req, 600e6);
        mkdirSync(join(root, 'assets'), { recursive: true });
        if (!within(root, 'assets')) return send(res, 403, { error: 'Asset folder must stay inside the project.' });
        const hash = createHash('sha1').update(data).digest('hex').slice(0, 8);
        const saved = `assets/${name.replace(ext, '')}-${hash}${ext}`;
        writeFileSync(join(root, saved), data);
        return send(res, 200, { path: saved });
      }
      if (path === '/api/assets') {
        const folder = join(root, 'assets');
        const files = existsSync(folder) ? readdirSync(folder).filter((f) => !f.startsWith('.')).map((f) => `assets/${f}`) : [];
        return send(res, 200, { files });
      }
      if (path === '/api/exports') {
        const folder = join(root, 'exports');
        const files = existsSync(folder)
          ? readdirSync(folder).filter((f) => /\.(mp4|png)$/.test(f) && !f.includes('-sheet')).sort().reverse()
          : [];
        return send(res, 200, { files });
      }
      if (path === '/api/job') return send(res, 200, state.job || { status: 'idle' });
      if (path === '/api/render' && req.method === 'POST') {
        if (!actions.render) return send(res, 501, { error: 'Rendering is not available here.' });
        if (state.job?.status === 'running') return send(res, 409, { error: 'A render is already running.' });
        const options = JSON.parse((await readBody(req, 1e5)).toString() || '{}');
        state.job = { status: 'running', progress: 0, message: 'Starting', options };
        actions.render(root, options, (progress, message) => { Object.assign(state.job, { progress, message }); })
          .then((result) => { state.job = { status: 'done', progress: 1, message: 'Finished', result }; })
          .catch((error) => { state.job = { status: 'failed', message: error.message }; });
        return send(res, 202, state.job);
      }
      if (path === '/api/check' && req.method === 'POST') {
        if (!actions.check) return send(res, 501, { error: 'Full check is not available here.' });
        return send(res, 200, await actions.check(root));
      }
      if (path === '/api/audio-preview' && req.method === 'POST') {
        if (!actions.audioPreview) return send(res, 501, { error: 'Audio preview is not available here.' });
        const body = JSON.parse((await readBody(req, 1e5)).toString() || '{}');
        return send(res, 200, await actions.audioPreview(root, body));
      }
      return send(res, 404, { error: 'Not found' });
    } catch (error) {
      if (res.headersSent || res.destroyed) { res.destroy(); return; }
      return send(res, 500, { error: error.message });
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const address = server.address();
  return { url: `http://127.0.0.1:${address.port}`, port: address.port, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }) };
}
