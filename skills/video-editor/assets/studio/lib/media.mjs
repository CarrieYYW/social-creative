// Footage becomes numbered frames once, so a frame request is exact and seeking is deterministic.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, realpathSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname, resolve, sep } from 'node:path';

const VIDEO = new Set(['.mp4', '.mov', '.webm', '.m4v', '.mkv']);

function collect(value, found) {
  if (typeof value === 'string') {
    if (VIDEO.has(extname(value).toLowerCase())) found.add(value);
  } else if (Array.isArray(value)) value.forEach((v) => collect(v, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collect(v, found));
}

export async function prepareMedia(root, project, { proxy = false } = {}) {
  const found = new Set();
  collect(project.values, found);
  const fps = project.fps;
  const out = {};
  for (const src of found) {
    const candidate = resolve(root, src);
    if (!existsSync(candidate)) continue;
    const file = realpathSync(candidate), boundary = realpathSync(root);
    if (file !== boundary && !file.startsWith(boundary + sep)) throw new Error(`Media must stay inside the project: ${src}`);
    const stat = statSync(file);
    const key = createHash('sha1').update(`${src}|${stat.size}|${stat.mtimeMs}|${fps}|${proxy}`).digest('hex').slice(0, 12);
    const folder = join(root, '.cache', 'frames', key);
    if (!existsSync(join(folder, '.done'))) {
      mkdirSync(folder, { recursive: true });
      const scale = proxy ? 'scale=540:-2' : 'scale=iw:ih';
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `fps=${fps},${scale}`, '-q:v', proxy ? '6' : '2', join(folder, '%06d.jpg')]);
      writeFileSync(join(folder, '.done'), '');
    }
    out[src] = { base: `/project/.cache/frames/${key}`, fps, count: readdirSync(folder).filter((f) => f.endsWith('.jpg')).length };
  }
  return out;
}
